import google.generativeai as genai
import logging
import json
import time
from sqlmodel import Session, select
from app.core.config import settings
from app.models import UserProfile

logger = logging.getLogger(__name__)

class GeneratorService:
    def __init__(self):
        api_key = settings.GOOGLE_API_KEY
        if not api_key:
            logger.warning("GOOGLE_API_KEY is not set. GeneratorService will fail if called.")
        else:
            genai.configure(api_key=api_key)
            self.model = genai.GenerativeModel(
                'models/gemini-2.5-flash',
                generation_config=genai.GenerationConfig(
                    response_mime_type="application/json"
                )
            )

    def generate_script(self, username: str, topic: str, session: Session) -> dict:
        """
        Generates a new video script based on the author's Master Profile from DB.
        """
        if not settings.GOOGLE_API_KEY:
             raise ValueError("GOOGLE_API_KEY is missing in environment variables.")

        # Find user and master profile
        statement = select(UserProfile).where(UserProfile.username == username)
        user = session.exec(statement).first()
        
        if not user or not user.master_profile:
            # Fallback? Or Error? Let's error for now as this is "Level 3 Generator"
            raise ValueError(f"No Master Profile found for user '{username}'. Please analyze at least one video first.")

        logger.info(f"Generating script for {username} on topic: '{topic}'...")
        
        system_instruction = f"""
        You are a top-tier Reels/Shorts screenwriter acting as the creator '{username}'.
        Your task is to write a VIRAL script on the topic: '{topic}'.
        
        You MUST strictly follow your own 'DNA' described in your Master Profile:
        {json.dumps(user.master_profile, indent=2)}
        
        INSTRUCTIONS:
        1. Tone & Pacing: Match your 'tone_of_voice' and 'avg_pacing_wpm'.
        2. Signature: Incorporate elements from 'winning_formula' and 'visual_signature'.
        3. Hook: Use a hook structure similar to your 'best_hooks'.
        
        OUTPUT FORMAT (JSON Only):
        {{
          "title": "Catchy Video Title",
          "script": [
            {{"time": "00:00-00:03", "visual": "Description of the shot...", "audio": "Voiceover or dialogue..."}}
          ],
          "viral_tips": "Specific advice on how to film/edit this to match your Master Profile."
        }}
        """

        try:
            start_time = time.time()
            response = self.model.generate_content(system_instruction)
            duration = time.time() - start_time
            logger.info(f"Script generation completed in {duration:.2f}s")
            
            response_text = response.text.strip()
            
            # Cleanup markdown if present
            if response_text.startswith("```json"):
                response_text = response_text[7:]
            if response_text.endswith("```"):
                response_text = response_text[:-3]
                
            return json.loads(response_text)
            
        except Exception as e:
            logger.error(f"Gemini API Error (Generation): {e}")
            raise Exception(f"Failed to generate script: {e}")
