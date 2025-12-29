from groq import Groq
import logging
import json
import time
from sqlmodel import Session, select
from app.core.config import settings
from app.models import UserProfile

logger = logging.getLogger(__name__)

class GeneratorService:
    def __init__(self):
        api_key = settings.GROQ_API_KEY
        if not api_key:
            logger.warning("GROQ_API_KEY is not set. GeneratorService will fail if called.")
            self.client = None
        else:
            self.client = Groq(api_key=api_key)
            logger.info("Groq client initialized")

    def generate_script(self, username: str, topic: str, session: Session) -> dict:
        """
        Generates a new video script based on the author's Master Profile from DB using Groq.
        """
        if not settings.GROQ_API_KEY:
             raise ValueError("GROQ_API_KEY is missing in environment variables.")

        if not self.client:
            raise ValueError("Groq client not initialized")

        # Find user and master profile
        statement = select(UserProfile).where(UserProfile.username == username)
        user = session.exec(statement).first()
        
        if not user or not user.master_profile:
            raise ValueError(f"No Master Profile found for user '{username}'. Please analyze at least one video first.")

        logger.info(f"Generating script for {username} on topic: '{topic}'...")
        
        system_instruction = f"""
        КРИТИЧЕСКИ ВАЖНО: Ты генерируешь контент для русскоязычной аудитории.
        ВЕСЬ выходной текст (заголовок, сценарий, ремарки, советы) должен быть СТРОГО на РУССКОМ языке.
        
        Правило JSON: Сохраняй ключи JSON на английском (например, 'title', 'script', 'visual', 'audio'), 
        но ВСЕ значения пиши на русском языке.
        
        Пример правильного формата:
        {{
            "title": "Как я заработал миллион за месяц",
            "script": [
                {{"time": "00:00-00:03", "visual": "Крупный план лица, яркий свет", "audio": "Вы думаете, что это невозможно?"}}
            ],
            "viral_tips": "Используйте быструю нарезку и крупные планы для удержания внимания"
        }}
        
        You are a top-tier Reels/Shorts screenwriter acting as the creator '{username}'.
        Your task is to write a VIRAL script on the topic: '{topic}'.
        You usually answer in JSON format.
        
        You MUST strictly follow your own 'DNA' described in your Master Profile:
        {json.dumps(user.master_profile, indent=2, ensure_ascii=False)}
        
        INSTRUCTIONS:
        1. Tone & Pacing: Match your 'tone_of_voice' and 'avg_pacing_wpm'.
        2. Signature: Incorporate elements from 'winning_formula' and 'visual_signature'.
        3. Hook: Use a hook structure similar to your 'best_hooks'.
        
        OUTPUT FORMAT (JSON Only, ключи на английском, значения на русском):
        {{
          "title": "String на русском. Цепляющий заголовок видео",
          "script": [
            {{"time": "00:00-00:03", "visual": "String на русском. Описание кадра...", "audio": "String на русском. Голос за кадром или диалог..."}}
          ],
          "viral_tips": "String на русском. Конкретные советы, как снять/смонтировать это видео, чтобы соответствовать вашему Master Profile."
        }}
        """

        # Retry logic for 429 errors
        max_attempts = 2
        for attempt in range(max_attempts):
            try:
                start_time = time.time()
                completion = self.client.chat.completions.create(
                    model="llama-3.3-70b-versatile",
                    messages=[
                        {
                            "role": "system",
                            "content": "You are an expert screenwriter. You usually answer in JSON format."
                        },
                        {
                            "role": "user",
                            "content": system_instruction
                        }
                    ],
                    temperature=0.7,
                    response_format={"type": "json_object"}
                )
                duration = time.time() - start_time
                logger.info(f"Script generation completed in {duration:.2f}s")
                
                response_text = completion.choices[0].message.content.strip()
                
                # Cleanup markdown if present
                if response_text.startswith("```json"):
                    response_text = response_text[7:]
                if response_text.endswith("```"):
                    response_text = response_text[:-3]
                    
                return json.loads(response_text)
                
            except Exception as e:
                error_str = str(e)
                is_rate_limit = "429" in error_str or "quota" in error_str.lower() or "rate limit" in error_str.lower()
                
                if is_rate_limit and attempt < max_attempts - 1:
                    logger.warning(f"Groq API 429 error (attempt {attempt + 1}/{max_attempts}). Retrying in 10s...")
                    time.sleep(10)
                    continue
                else:
                    logger.error(f"Groq API Error (Generation): {e}")
                    raise Exception(f"Failed to generate script: {e}")
