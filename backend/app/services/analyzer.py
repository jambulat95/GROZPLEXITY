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

    def analyze_video_style(self, transcript_text: str, frames_dir: Path, stats: dict, video_url: str, session: Session) -> dict:
        """
        Analyzes video style using Gemini, saves result to DB, and triggers profile update.
        """
        if not settings.GOOGLE_API_KEY:
             raise ValueError("GOOGLE_API_KEY is missing in environment variables.")

        logger.info("Starting video style analysis with Gemini...")
        
        # 1. Prepare Images
        image_files = sorted(list(frames_dir.glob("*.jpg")))
        if not image_files:
            raise FileNotFoundError(f"No frames found in {frames_dir}")

        max_frames = 15
        step = max(1, len(image_files) // max_frames)
        selected_frames_paths = image_files[::step][:max_frames]
        
        logger.info(f"Selected {len(selected_frames_paths)} frames for analysis.")

        processed_images = []
        for img_path in selected_frames_paths:
            try:
                img = Image.open(img_path)
                if img.width > 512:
                    ratio = 512 / img.width
                    new_height = int(img.height * ratio)
                    img = img.resize((512, new_height))
                processed_images.append(img)
            except Exception as e:
                logger.warning(f"Failed to process image {img_path}: {e}")

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
        You are a professional video editor and viral content marketer.
        Analyze the provided video frames and audio transcription to create a "Style Passport".
        
        {stats_context}
        
        Output MUST be valid JSON with this exact structure:
        {{
            "hook_analysis": "String. Analyze the first 5 seconds. Why does it grab attention? (Visuals/Audio)",
            "pacing_wpm": Number. Estimated words per minute or perceived speed (1-10 scale where 10 is super fast).",
            "visual_style": "String. Describe color grading, camera angles, dynamic/static shots.",
            "audio_tone": "String. Describe the speaker's tone (energetic, calm, sarcastic, etc).",
            "structure": [
                {{"time": "String (e.g. 00:00-00:05)", "block": "Hook/Body/CTA", "description": "String"}}
            ],
            "virality_score": Number (1-10). How likely is this to go viral on Shorts/Reels?",
            "key_elements": ["String", "String"] (List of specific editing techniques used, e.g. 'zoom-ins', 'subtitles', 'b-roll'),
            "stats_analysis": "String. Brief comment on how the style correlates with the view count."
        }}
        """

        prompt = [
            system_instruction,
            f"TRANSCRIPT:\n{transcript_text}\n\nVISUALS (Attached Frames):",
            *processed_images
        ]

        # 4. Call API
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
            
            # Find or create user
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
            logger.error(f"Gemini API Error: {e}")
            return {
                "error": str(e),
                "passport": {"error": "Analysis failed"}
            }
