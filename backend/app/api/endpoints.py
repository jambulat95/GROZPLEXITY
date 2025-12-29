from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from functools import lru_cache
import logging
import json
from sqlmodel import Session, select

from app.services.downloader import DownloaderService
from app.services.video_processing import VideoProcessingService
from app.services.transcriber import TranscriberService
from app.services.analyzer import AnalyzerService
from app.services.generator import GeneratorService
from app.services.profile_builder import ProfileBuilderService
from app.core.db import get_session
from app.models import UserProfile, VideoAnalysis
from app.api.deps import get_current_user_optional

router = APIRouter()
logger = logging.getLogger(__name__)

class AnalyzeRequest(BaseModel):
    url: str

class GenerateRequest(BaseModel):
    username: str
    topic: str

class Segment(BaseModel):
    start: float
    end: float
    text: str

class Paths(BaseModel):
    video: str
    audio: str
    frames: str

class AnalyzeResponse(BaseModel):
    status: str
    video_id: int
    username: str
    transcript_text: str
    segments: List[Segment]
    paths: Paths
    style_passport: Optional[Dict[str, Any]] = None
    meta_stats: Optional[Dict[str, Any]] = None

class GenerateResponse(BaseModel):
    status: str
    script_data: Dict[str, Any]

class ProfileResponse(BaseModel):
    username: str
    master_profile: Dict
    videos_count: int
    videos: List[Dict]

class VideoResponse(BaseModel):
    status: str
    video_id: int
    username: str
    transcript_text: str  # Will be empty if not stored
    style_passport: Optional[Dict[str, Any]] = None
    meta_stats: Optional[Dict[str, Any]] = None
    youtube_url: str
    title: str

# Dependencies
@lru_cache()
def get_transcriber_service():
    return TranscriberService()

def get_downloader_service():
    return DownloaderService()

def get_video_processing_service():
    return VideoProcessingService()

def get_analyzer_service():
    return AnalyzerService()

def get_generator_service():
    return GeneratorService()

def get_profile_builder_service():
    return ProfileBuilderService()

@router.post("/analyze", response_model=AnalyzeResponse)
def analyze_video(
    request: AnalyzeRequest,
    session: Session = Depends(get_session),
    current_user: Optional[UserProfile] = Depends(get_current_user_optional),
    downloader: DownloaderService = Depends(get_downloader_service),
    video_processor: VideoProcessingService = Depends(get_video_processing_service),
    transcriber: TranscriberService = Depends(get_transcriber_service),
    analyzer: AnalyzerService = Depends(get_analyzer_service),
    profile_builder: ProfileBuilderService = Depends(get_profile_builder_service)
):
    """
    Analyze video: Download -> Extract -> Transcribe -> AI Analyze -> Save to DB -> Update Profile.
    """
    logger.info(f"Received analyze request for URL: {request.url}")
    try:
        # 1. Download
        logger.info("Step 1/5: Downloading video...")
        download_result = downloader.download(request.url)
        video_path = download_result["video_path"]
        video_id_str = download_result["video_id"] # YouTube ID string
        
        video_stats = {
            "view_count": download_result.get("view_count", 0),
            "like_count": download_result.get("like_count", 0),
            "comment_count": download_result.get("comment_count", 0),
            "uploader": download_result.get("uploader", "Unknown"),
            "title": download_result.get("title", "Unknown"),
            "duration": download_result.get("duration", 0)
        }
        
        # 2. Extract
        logger.info("Step 2/5: Processing video...")
        audio_path = video_processor.extract_audio(video_path, video_id_str)
        frames_dir = video_processor.extract_frames(video_path, video_id_str)
        
        # 3. Transcribe
        logger.info("Step 3/5: Transcribing...")
        transcript_result = transcriber.transcribe(audio_path)
        
        # 4. Analyze & Save to DB
        logger.info("Step 4/5: Analyzing style & saving...")
        analysis_result = analyzer.analyze_video_style(
            transcript_text=transcript_result["text"],
            frames_dir=frames_dir,
            stats=video_stats,
            video_url=request.url,
            session=session,
            current_user_id=current_user.id if current_user else None
        )
        
        # Check if analysis failed
        if "error" in analysis_result:
            error_msg = analysis_result.get("error", "Unknown error during analysis")
            logger.error(f"Analysis failed: {error_msg}")
            raise Exception(f"Video analysis failed: {error_msg}")
        
        db_video_id = analysis_result.get("video_id")
        db_user_id = analysis_result.get("user_id")
        username = analysis_result.get("username")
        style_passport = analysis_result.get("passport")
        
        # Validate that we have required fields
        if not db_video_id or not username:
            error_msg = analysis_result.get("error", "Analysis completed but missing required fields")
            logger.error(f"Analysis incomplete: video_id={db_video_id}, username={username}")
            raise Exception(f"Video analysis incomplete: {error_msg}")

        # 5. Update Master Profile
        logger.info("Step 5/5: Updating Master Profile...")
        if db_user_id:
            profile_builder.update_master_profile(db_user_id, session)

        logger.info("Analysis flow completed successfully.")
        
        # Use current user's username instead of uploader_name
        response_username = current_user.username if current_user else username
        
        return AnalyzeResponse(
            status="success",
            video_id=db_video_id,
            username=response_username,
            transcript_text=transcript_result["text"],
            segments=transcript_result["segments"],
            paths=Paths(
                video=str(video_path),
                audio=str(audio_path),
                frames=str(frames_dir)
            ),
            style_passport=style_passport,
            meta_stats=video_stats
        )

    except Exception as e:
        logger.error(f"Error during analysis: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/generate", response_model=GenerateResponse)
def generate_script_endpoint(
    request: GenerateRequest,
    session: Session = Depends(get_session),
    generator: GeneratorService = Depends(get_generator_service)
):
    """
    Generates a script based on the author's Master Profile (DNA).
    """
    logger.info(f"Received generate request for user: '{request.username}' topic: '{request.topic}'")
    
    try:
        script_data = generator.generate_script(request.username, request.topic, session)
        
        return GenerateResponse(
            status="success",
            script_data=script_data
        )
        
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.error(f"Error during generation: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/profile/{username}", response_model=ProfileResponse)
def get_profile(
    username: str,
    session: Session = Depends(get_session)
):
    """
    Get author's profile, including Master DNA and list of analyzed videos.
    """
    user = session.exec(select(UserProfile).where(UserProfile.username == username)).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    videos = []
    for v in user.videos:
        videos.append({
            "id": v.id,
            "title": v.title,
            "url": v.youtube_url,
            "views": v.stats.get("view_count", 0),
            "created_at": v.created_at
        })
        
    return ProfileResponse(
        username=user.username,
        master_profile=user.master_profile,
        videos_count=len(videos),
        videos=videos
    )

@router.post("/profile/{username}/refresh", response_model=ProfileResponse)
def refresh_profile(
    username: str,
    session: Session = Depends(get_session),
    profile_builder: ProfileBuilderService = Depends(get_profile_builder_service)
):
    """
    Force update/re-synthesis of the user's Master Profile based on existing videos.
    Useful if analysis failed or we want to update the AI's understanding.
    """
    user = session.exec(select(UserProfile).where(UserProfile.username == username)).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    try:
        profile_builder.update_master_profile(user.id, session)
        session.refresh(user)
    except Exception as e:
        logger.error(f"Error refreshing profile: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to refresh profile: {str(e)}")
        
    videos = []
    for v in user.videos:
        videos.append({
            "id": v.id,
            "title": v.title,
            "url": v.youtube_url,
            "views": v.stats.get("view_count", 0),
            "created_at": v.created_at
        })
        
    return ProfileResponse(
        username=user.username,
        master_profile=user.master_profile,
        videos_count=len(videos),
        videos=videos
    )

@router.get("/video/{video_id}", response_model=VideoResponse)
def get_video_analysis(
    video_id: int,
    session: Session = Depends(get_session)
):
    """
    Get full video analysis by video ID.
    Returns statistics, transcript (if available), and style analysis.
    """
    logger.info(f"Received request for video ID: {video_id}")
    
    # Find video in database
    video = session.get(VideoAnalysis, video_id)
    if not video:
        logger.warning(f"Video with ID {video_id} not found")
        raise HTTPException(status_code=404, detail=f"Video with ID {video_id} not found")
    
    # Get user for username
    user = session.get(UserProfile, video.user_id)
    if not user:
        logger.warning(f"User with ID {video.user_id} not found for video {video_id}")
        raise HTTPException(status_code=404, detail="User not found for this video")
    
    # Prepare response data
    # Note: transcript_text is not stored in DB, so we return empty string
    # meta_stats comes from video.stats
    meta_stats = video.stats.copy() if video.stats else {}
    # Ensure title is in meta_stats
    if video.title and "title" not in meta_stats:
        meta_stats["title"] = video.title
    
    # style_passport comes from video.analysis_result
    style_passport = video.analysis_result if video.analysis_result else None
    
    logger.info(f"Successfully retrieved video {video_id} for user {user.username}")
    
    return VideoResponse(
        status="success",
        video_id=video.id,
        username=user.username,
        transcript_text="",  # Transcript is not stored in DB
        style_passport=style_passport,
        meta_stats=meta_stats,
        youtube_url=video.youtube_url,
        title=video.title
    )

