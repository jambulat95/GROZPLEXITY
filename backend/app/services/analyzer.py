import google.generativeai as genai
from PIL import Image
from pathlib import Path
import os
import logging
import json
import time
from sqlmodel import Session, select
from app.core.config import settings
from app.models import UserProfile, VideoAnalysis

logger = logging.getLogger(__name__)

class AnalyzerService:
    def __init__(self):
        api_key = settings.GOOGLE_API_KEY
        if not api_key:
            logger.warning("GOOGLE_API_KEY is not set. AnalyzerService will fail if called.")
        else:
            genai.configure(api_key=api_key)
            self.model = genai.GenerativeModel(
                'models/gemini-2.5-flash',
                generation_config=genai.GenerationConfig(
                    response_mime_type="application/json"
                )
            )
            logger.info("Gemini client initialized for vision analysis")

    def analyze_video_style(self, transcript_text: str, frames_dir: Path, stats: dict, video_url: str, session: Session, current_user_id: int = None) -> dict:
        """
        Analyzes video style using Gemini Vision API, saves result to DB, and triggers profile update.
        """
        if not settings.GOOGLE_API_KEY:
             raise ValueError("GOOGLE_API_KEY is missing in environment variables.")

        logger.info("Starting video style analysis with Gemini Vision...")
        
        # 1. Prepare Images (Optimized: max 3 frames)
        image_files = sorted(list(frames_dir.glob("*.jpg")))
        if not image_files:
            raise FileNotFoundError(f"No frames found in {frames_dir}")

        # Select 3 frames: beginning, middle, end
        max_frames = 3
        if len(image_files) >= 3:
            # Take first, middle, last
            selected_indices = [0, len(image_files) // 2, len(image_files) - 1]
            selected_frames_paths = [image_files[i] for i in selected_indices]
        else:
            selected_frames_paths = image_files
        
        logger.info(f"Selected {len(selected_frames_paths)} frames for analysis (from {len(image_files)} total frames).")

        processed_images = []
        for img_path in selected_frames_paths:
            try:
                # Use thumbnail for efficient compression to 512x512 max
                img = Image.open(img_path)
                # Convert to RGB if needed (removes alpha channel, optimizes format)
                if img.mode != 'RGB':
                    img = img.convert('RGB')
                img.thumbnail((512, 512), Image.Resampling.LANCZOS)
                processed_images.append(img)
            except Exception as e:
                logger.warning(f"Failed to process image {img_path}: {e}")
        
        if not processed_images:
            raise ValueError("No images were successfully processed")
        
        logger.info(f"Processed {len(processed_images)} images (all converted to RGB, max 512x512)")

        # 2. Context from Stats
        stats_context = ""
        if stats:
            stats_context = f"""
            VIDEO STATISTICS:
            - Views: {stats.get('view_count', 0)}
            - Likes: {stats.get('like_count', 0)}
            - Comments: {stats.get('comment_count', 0)}
            - Author: {stats.get('uploader', 'Unknown')}
            
            IMPORTANT: These statistics indicate the video's actual performance.
            If views > 100,000, explicitly look for and analyze the specific 'viral triggers' that caused this success.
            """

        # 3. Prompt
        system_instruction = f"""
        КРИТИЧЕСКИ ВАЖНО: Ты анализируешь и генерируешь контент для русскоязычной аудитории.
        ВЕСЬ выходной текст (описания, анализ стиля, советы) должен быть СТРОГО на РУССКОМ языке.
        
        Правило JSON: Сохраняй ключи JSON на английском (например, 'hook_analysis', 'visual_style', 'pacing_wpm'), 
        но ВСЕ значения пиши на русском языке.
        
        Пример правильного формата:
        {{
            "hook_analysis": "Яркий визуальный ряд с крупным планом лица, агрессивная музыка",
            "visual_style": "Быстрая смена кадров, насыщенные цвета, динамичные переходы",
            "audio_tone": "Энергичный и саркастичный"
        }}
        
        You are a professional video editor and viral content marketer.
        Analyze the provided video frames and audio transcription to create a "Style Passport".
        
        {stats_context}
        
        Output MUST be valid JSON with this exact structure (ключи на английском, значения на русском):
        {{
            "hook_analysis": "String на русском. Анализ первых 5 секунд. Почему это цепляет внимание? (Визуал/Аудио)",
            "pacing_wpm": Number. Оценка темпа речи (1-10, где 10 - очень быстро)",
            "visual_style": "String на русском. Описание цветокоррекции, ракурсов камеры, динамики кадров.",
            "audio_tone": "String на русском. Описание тона голоса (энергичный, спокойный, саркастичный и т.д.).",
            "structure": [
                {{"time": "String (например, 00:00-00:05)", "block": "Hook/Body/CTA", "description": "String на русском"}}
            ],
            "virality_score": Number (1-10). Насколько вероятно, что это видео станет вирусным на Shorts/Reels?",
            "key_elements": ["String на русском", "String на русском"] (Список конкретных приемов монтажа, например: 'зумы', 'субтитры', 'b-roll'),
            "stats_analysis": "String на русском. Краткий комментарий о том, как стиль коррелирует с количеством просмотров."
        }}
        """

        # Limit transcript length to avoid exceeding token limits (max ~2000 chars)
        max_transcript_length = 2000
        if len(transcript_text) > max_transcript_length:
            truncated_text = transcript_text[:max_transcript_length] + "... [truncated]"
            logger.warning(f"Transcript truncated from {len(transcript_text)} to {len(truncated_text)} characters")
            transcript_text = truncated_text
        
        # Estimate data size for logging
        prompt_text_size = len(system_instruction) + len(transcript_text)
        logger.info(f"Sending request: {len(processed_images)} images, ~{prompt_text_size} chars text")
        
        prompt = [
            system_instruction,
            f"TRANSCRIPT:\n{transcript_text}\n\nVISUALS (Attached Frames):",
            *processed_images
        ]

        # 4. Call API with retry logic for 429 errors
        max_attempts = 2  # Initial + 1 retry
        for attempt in range(max_attempts):
            try:
                start_time = time.time()
                response = self.model.generate_content(prompt)
                duration = time.time() - start_time
                logger.info(f"Gemini analysis completed in {duration:.2f}s")
                
                response_text = response.text.strip()
                # Cleanup markdown
                if response_text.startswith("```json"):
                    response_text = response_text[7:]
                if response_text.endswith("```"):
                    response_text = response_text[:-3]
                
                result_json = json.loads(response_text)
                
                # 5. Save to DB
                uploader_name = stats.get("uploader", "Unknown Author")
                
                # Use current authenticated user if provided, otherwise fallback to uploader_name
                if current_user_id:
                    user = session.get(UserProfile, current_user_id)
                    if not user:
                        logger.warning(f"Current user {current_user_id} not found, falling back to uploader_name")
                        current_user_id = None
                
                if not current_user_id:
                    # Fallback: Find or create user by uploader_name (for backward compatibility)
                    statement = select(UserProfile).where(UserProfile.username == uploader_name)
                    results = session.exec(statement)
                    user = results.first()
                    
                    if not user:
                        logger.info(f"Creating new user profile for: {uploader_name}")
                        user = UserProfile(username=uploader_name)
                        session.add(user)
                        session.commit()
                        session.refresh(user)
                
                # Save video analysis
                video = VideoAnalysis(
                    user_id=user.id,
                    youtube_url=video_url,
                    title=stats.get("title", "Unknown"),
                    stats=stats,
                    analysis_result=result_json
                )
                session.add(video)
                session.commit()
                session.refresh(video)
                
                logger.info(f"Saved video analysis to DB (ID: {video.id})")
                
                # Return combined result
                return {
                    "passport": result_json,
                    "video_id": video.id,
                    "user_id": user.id,
                    "username": user.username
                }
                
            except Exception as e:
                error_str = str(e)
                is_rate_limit = "429" in error_str or "quota" in error_str.lower() or "rate limit" in error_str.lower()
                
                if is_rate_limit and attempt < max_attempts - 1:
                    logger.warning(f"Gemini API 429 error (attempt {attempt + 1}/{max_attempts}). Retrying in 10s...")
                    time.sleep(10)
                    continue
                else:
                    logger.error(f"Gemini API Error: {e}")
                    return {
                        "error": str(e),
                        "passport": {"error": "Analysis failed"}
                    }
