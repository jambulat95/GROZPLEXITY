import yt_dlp
from pathlib import Path
import logging
import threading
import time
from app.core.config import settings

logger = logging.getLogger(__name__)

class DownloaderService:
    # Class-level locks to prevent concurrent downloads of the same video
    _download_locks = {}
    _locks_lock = threading.Lock()
    
    def _get_lock(self, video_id: str) -> threading.Lock:
        """Get or create a lock for a specific video_id."""
        with self._locks_lock:
            if video_id not in self._download_locks:
                self._download_locks[video_id] = threading.Lock()
            return self._download_locks[video_id]
    
    def _wait_for_file(self, file_path: Path, max_wait: int = 30) -> bool:
        """Wait for a file to be available (not being downloaded)."""
        wait_time = 0
        while wait_time < max_wait:
            if file_path.exists():
                # Check if it's still being downloaded (.part file exists)
                part_file = Path(str(file_path) + '.part')
                if not part_file.exists():
                    return True
            time.sleep(0.5)
            wait_time += 0.5
        return file_path.exists()
    
    def download(self, url: str) -> dict:
        """
        Downloads video from URL using yt-dlp.
        Returns a dictionary with video_path, video_id, and metadata.
        Handles concurrent downloads by checking if file exists and using locks.
        """
        logger.info(f"Starting download for URL: {url}")
        
        # First, extract info without downloading to get video_id
        ydl_opts_info = {
            'noplaylist': True,
            'quiet': True,
        }
        
        try:
            with yt_dlp.YoutubeDL(ydl_opts_info) as ydl:
                logger.info("Extracting video info...")
                info = ydl.extract_info(url, download=False)
                video_id = info.get('id')
                ext = info.get('ext', 'mp4')
                
                # Construct expected path
                filename = f"{video_id}.{ext}"
                file_path = settings.TEMP_DIR / filename
                
                # Fallback check for .mp4 if extension differs
                if not file_path.exists():
                    mp4_path = settings.TEMP_DIR / f"{video_id}.mp4"
                    if mp4_path.exists():
                        file_path = mp4_path
                        ext = 'mp4'
                
                # Get lock for this video_id
                lock = self._get_lock(video_id)
                
                with lock:
                    # Check if file already exists and is complete
                    if file_path.exists():
                        part_file = Path(str(file_path) + '.part')
                        if part_file.exists():
                            # File is being downloaded, wait for it
                            logger.info(f"File {file_path} is being downloaded by another request, waiting...")
                            if not self._wait_for_file(file_path):
                                raise Exception(f"Timeout waiting for file {file_path} to be available")
                            logger.info(f"File {file_path} is now available")
                        else:
                            # File exists and is complete, just extract metadata
                            logger.info(f"File {file_path} already exists, skipping download")
                    else:
                        # File doesn't exist, download it
                        ydl_opts = {
                            'format': 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best',
                            'outtmpl': str(settings.TEMP_DIR / '%(id)s.%(ext)s'),
                            'noplaylist': True,
                            'quiet': True,
                            'overwrites': True,
                        }
                        
                        with yt_dlp.YoutubeDL(ydl_opts) as ydl_download:
                            logger.info(f"Downloading video {video_id}...")
                            info = ydl_download.extract_info(url, download=True)
                            logger.info(f"Download completed: {file_path}")
                    
                    # Verify file exists after download/wait
                    if not file_path.exists():
                        # Try mp4 extension
                        mp4_path = settings.TEMP_DIR / f"{video_id}.mp4"
                        if mp4_path.exists():
                            file_path = mp4_path
                        else:
                            raise Exception(f"Downloaded file not found: {file_path}")
                
                # Extract metadata (re-fetch if we used cached file)
                if 'title' not in info or not info.get('title'):
                    with yt_dlp.YoutubeDL(ydl_opts_info) as ydl:
                        info = ydl.extract_info(url, download=False)
                
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
                
                logger.info(f"Metadata extracted: {metadata['view_count']} views, {metadata['like_count']} likes")
                
                return metadata
                
        except Exception as e:
            logger.error(f"Failed to download video: {str(e)}")
            raise Exception(f"Failed to download video: {str(e)}")
