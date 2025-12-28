import os
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

class Settings:
    BASE_DIR: Path = Path(__file__).resolve().parent.parent.parent
    TEMP_DIR: Path = BASE_DIR / "temp"
    
    # Placeholder for future API keys
    GOOGLE_API_KEY: str = os.getenv("GOOGLE_API_KEY", "")
    
    def __init__(self):
        # Ensure temp directories exist
        self.TEMP_DIR.mkdir(parents=True, exist_ok=True)
        (self.TEMP_DIR / "frames").mkdir(parents=True, exist_ok=True)

settings = Settings()
