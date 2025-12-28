import yt_dlp
from pathlib import Path
import logging
from app.core.config import settings

logger = logging.getLogger(__name__)

class DownloaderService:
    def download(self, url: str) -> dict:
        """
        Downloads video from URL using yt-dlp.
        Returns a dictionary with video_path, video_id, and metadata.
        """
        logger.info(f"Starting download for URL: {url}")
        
        ydl_opts = {
            'format': 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best',  # Ensure mp4
            'outtmpl': str(settings.TEMP_DIR / '%(id)s.%(ext)s'),
            'noplaylist': True,
            'quiet': True,
            'overwrites': True,
        }

        try:
            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                logger.info("Extracting video info...")
                info = ydl.extract_info(url, download=True)
                video_id = info.get('id')
                ext = info.get('ext')
                
                # Construct expected path
                filename = f"{video_id}.{ext}"
                file_path = settings.TEMP_DIR / filename
                
                if not file_path.exists():
                     # Fallback check for .mp4 if it was merged
                     if (settings.TEMP_DIR / f"{video_id}.mp4").exists():
                         file_path = settings.TEMP_DIR / f"{video_id}.mp4"
                
                # Extract metadata
                metadata = {
                    "video_id": video_id,
                    "video_path": file_path,
                    "title": info.get('title', 'Unknown Title'),
                    "uploader": info.get('uploader', 'Unknown Author'),
                    "view_count": info.get('view_count', 0) or 0,
                    "like_count": info.get('like_count', 0) or 0,
                    "comment_count": info.get('comment_count', 0) or 0,
                    "duration": info.get('duration', 0) or 0,
                }
                
                logger.info(f"Download completed: {file_path}")
                logger.info(f"Metadata extracted: {metadata['view_count']} views, {metadata['like_count']} likes")
                
                return metadata
                
        except Exception as e:
            logger.error(f"Failed to download video: {str(e)}")
            raise Exception(f"Failed to download video: {str(e)}")
