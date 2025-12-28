import google.generativeai as genai
import logging
import json
from datetime import datetime
from sqlmodel import Session, select
from app.core.config import settings
from app.models import UserProfile, VideoAnalysis

logger = logging.getLogger(__name__)

class ProfileBuilderService:
    def __init__(self):
        api_key = settings.GOOGLE_API_KEY
        genai.configure(api_key=api_key)
        self.model = genai.GenerativeModel(
            'models/gemini-2.5-flash',
            generation_config=genai.GenerationConfig(
                response_mime_type="application/json"
            )
        )

    def update_master_profile(self, user_id: int, session: Session):
        """
        Synthesizes a 'Master Profile' (DNA of style) based on all analyzed videos of the author.
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
        You are an expert AI Analyst specializing in Creator Economy.
        Your task is to synthesize a "Master Style DNA" (UserProfile) for a creator based on the analysis of their videos.
        
        Creator: {user.username}
        Analyzed Videos: {json.dumps(history_summary, indent=2, ensure_ascii=False)}
        
        Analyze patterns across these videos. What is consistent? What makes their most viral videos successful?
        
        Output JSON:
        {{
            "core_identity": "String. One sentence summary of who they are.",
            "winning_formula": ["List of key elements present in their best performing videos"],
            "tone_of_voice": "Consistent audio/verbal style",
            "visual_signature": "Consistent visual elements (colors, editing speed)",
            "avg_pacing_wpm": Number,
            "best_hooks": ["Examples of successful hooks they used"],
            "weaknesses": "What to improve based on lower performing videos (if any)"
        }}
        """
        
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
            
        except Exception as e:
            logger.error(f"Failed to synthesize profile: {e}", exc_info=True)
