import ffmpeg
import os
import logging
from pathlib import Path
from app.core.config import settings

logger = logging.getLogger(__name__)

class VideoProcessingService:
    def extract_audio(self, video_path: Path, video_id: str) -> Path:
        """
        Extracts audio from video and saves as MP3.
        Returns path to the audio file.
        """
        output_path = settings.TEMP_DIR / f"{video_id}.mp3"
        logger.info(f"Extracting audio from {video_path} to {output_path}")
        
        try:
            (
                ffmpeg
                .input(str(video_path))
                .output(str(output_path), acodec='libmp3lame', qscale=2, loglevel="info")
                .overwrite_output()
                .run(capture_stdout=True, capture_stderr=True)
            )
            logger.info("Audio extraction completed")
            return output_path
        except ffmpeg.Error as e:
            error_msg = e.stderr.decode('utf8')
            logger.error(f"FFmpeg error extracting audio: {error_msg}")
            raise Exception(f"FFmpeg error extracting audio: {error_msg}")

    def extract_frames(self, video_path: Path, video_id: str, interval: int = 2) -> Path:
        """
        Extracts frames from video every `interval` seconds.
        Saves them to temp/frames/{video_id}/.
        Returns path to the frames directory.
        """
        frames_dir = settings.TEMP_DIR / "frames" / video_id
        frames_dir.mkdir(parents=True, exist_ok=True)
        
        output_pattern = str(frames_dir / "frame_%04d.jpg")
        logger.info(f"Extracting frames to {frames_dir} every {interval}s")
        
        try:
            (
                ffmpeg
                .input(str(video_path))
                .output(output_pattern, vf=f"fps=1/{interval}", qscale=2, loglevel="error")
                .overwrite_output()
                .run(capture_stdout=True, capture_stderr=True)
            )
            logger.info("Frame extraction completed")
            return frames_dir
        except ffmpeg.Error as e:
            error_msg = e.stderr.decode('utf8')
            logger.error(f"FFmpeg error extracting frames: {error_msg}")
            raise Exception(f"FFmpeg error extracting frames: {error_msg}")
