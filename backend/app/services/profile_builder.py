import google.generativeai as genai
import logging
import json
import time
from datetime import datetime
from sqlmodel import Session, select
from app.core.config import settings
from app.models import UserProfile, VideoAnalysis

logger = logging.getLogger(__name__)

class ProfileBuilderService:
    def __init__(self):
        api_key = settings.GOOGLE_API_KEY
        if not api_key:
            logger.warning("GOOGLE_API_KEY is not set. ProfileBuilderService will fail if called.")
        else:
            genai.configure(api_key=api_key)
            self.model = genai.GenerativeModel(
                'models/gemini-2.5-flash',
                generation_config=genai.GenerationConfig(
                    response_mime_type="application/json"
                )
            )
            logger.info("Gemini client initialized for profile building")

    def update_master_profile(self, user_id: int, session: Session):
        """
        Synthesizes a 'Master Profile' (DNA of style) based on all analyzed videos of the author using Gemini.
        """
        user = session.get(UserProfile, user_id)
        if not user:
            logger.error(f"User not found: {user_id}")
            return
            
        videos = session.exec(select(VideoAnalysis).where(VideoAnalysis.user_id == user_id)).all()
        
        if not videos:
            logger.warning("No videos found for profile synthesis.")
            return

        logger.info(f"Synthesizing Master Profile for {user.username} based on {len(videos)} videos.")
        
        # Prepare data for LLM
        history_summary = []
        for v in videos:
            history_summary.append({
                "title": v.title,
                "views": v.stats.get("view_count", 0),
                "analysis": v.analysis_result
            })
            
        system_instruction = f"""
        КРИТИЧЕСКИ ВАЖНО: Ты анализируешь и генерируешь контент для русскоязычной аудитории.
        ВЕСЬ выходной текст (описания, анализ ДНК стиля, советы) должен быть СТРОГО на РУССКОМ языке.
        
        Правило JSON: Сохраняй ключи JSON на английском (например, 'core_identity', 'winning_formula'), 
        но ВСЕ значения пиши на русском языке.
        
        Пример правильного формата:
        {{
            "core_identity": "Эксперт по личным финансам, который объясняет сложные темы простым языком",
            "winning_formula": ["Быстрая нарезка", "Числа в кадре", "Конкретные примеры"],
            "tone_of_voice": "Дружелюбный и уверенный, с легкой иронией"
        }}
        
        You are an expert AI Analyst specializing in Creator Economy.
        Your task is to synthesize a "Master Style DNA" (UserProfile) for a creator based on the analysis of their videos.
        
        Creator: {user.username}
        Analyzed Videos: {json.dumps(history_summary, indent=2, ensure_ascii=False)}
        
        Analyze patterns across these videos. What is consistent? What makes their most viral videos successful?
        
        Output JSON (ключи на английском, значения на русском):
        {{
            "core_identity": "String на русском. Одно предложение, описывающее суть автора.",
            "winning_formula": ["String на русском", "String на русском"] (Список ключевых элементов из их самых успешных видео),
            "tone_of_voice": "String на русском. Постоянный аудио/вербальный стиль",
            "visual_signature": "String на русском. Постоянные визуальные элементы (цвета, скорость монтажа)",
            "avg_pacing_wpm": Number,
            "best_hooks": ["String на русском", "String на русском"] (Примеры успешных хуков, которые они использовали),
            "weaknesses": "String на русском. Что улучшить на основе менее успешных видео (если есть)"
        }}
        """
        
        # Retry logic for 429 errors
        max_attempts = 2
        for attempt in range(max_attempts):
            try:
                response = self.model.generate_content(system_instruction)
                response_text = response.text.strip()
                
                # Cleanup markdown if present
                if response_text.startswith("```json"):
                    response_text = response_text[7:]
                if response_text.endswith("```"):
                    response_text = response_text[:-3]

                master_profile_json = json.loads(response_text)
                
                user.master_profile = master_profile_json
                user.last_updated = datetime.utcnow()
                session.add(user)
                session.commit()
                logger.info(f"Master Profile updated for {user.username}: {master_profile_json.get('core_identity')}")
                return
                
            except Exception as e:
                error_str = str(e)
                is_rate_limit = "429" in error_str or "quota" in error_str.lower() or "rate limit" in error_str.lower()
                
                if is_rate_limit and attempt < max_attempts - 1:
                    logger.warning(f"Gemini API 429 error (attempt {attempt + 1}/{max_attempts}). Retrying in 10s...")
                    time.sleep(10)
                    continue
                else:
                    logger.error(f"Failed to synthesize profile: {e}", exc_info=True)
                    return
