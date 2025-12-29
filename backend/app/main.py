from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.api.endpoints import router as api_router, get_transcriber_service
from app.api.auth import router as auth_router
from app.core.config import settings
from app.core.logging import setup_logging
from app.core.db import create_db_and_tables
import logging
import sys

# Setup logging immediately
setup_logging()
logger = logging.getLogger(__name__)

app = FastAPI(title="Video Content Reverse Engineering AI")

# CORS configuration
origins = ["*"]  # For MVP allow all, can be restricted later

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount temp directory as static files to allow accessing downloaded/generated content
# e.g. http://localhost:8000/temp/video.mp4
app.mount("/temp", StaticFiles(directory=settings.TEMP_DIR), name="temp")

app.include_router(auth_router, prefix="/api/v1/auth", tags=["auth"])
app.include_router(api_router, prefix="/api/v1")

@app.on_event("startup")
async def startup_event():
    # Use print as a backup to guarantee visibility
    print("--- APPLICATION STARTUP INITIATED ---", file=sys.stderr)
    logger.info("Starting up application...")
    
    # Initialize DB
    logger.info("Initializing Database...")
    create_db_and_tables()
    logger.info("Database initialized.")

    logger.info("Pre-loading AI models. This might take a few minutes if downloading for the first time...")
    try:
        # Trigger model loading
        get_transcriber_service()
        logger.info("AI models loaded successfully.")
    except Exception as e:
        logger.error(f"Failed to load AI models: {e}")
        print(f"CRITICAL ERROR: {e}", file=sys.stderr)

@app.get("/")
def read_root():
    return {"message": "Video Analysis API is running. Go to /docs for Swagger UI."}
