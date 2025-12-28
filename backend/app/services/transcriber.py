from faster_whisper import WhisperModel
from pathlib import Path
import os
import logging
import time

logger = logging.getLogger(__name__)

class TranscriberService:
    def __init__(self):
        self.model_size = "small"
        logger.info(f"Loading faster-whisper model: {self.model_size}")
        
        try:
            # Run on CPU as requested.
            # compute_type="int8" is usually efficient for CPU.
            self.model = WhisperModel(self.model_size, device="cpu", compute_type="int8")
            logger.info("Model loaded successfully")
        except Exception as e:
            logger.error(f"Error loading WhisperModel: {e}")
            raise e

    def transcribe(self, audio_path: Path):
        """
        Transcribes audio file using faster-whisper.
        Returns tuple (full_text, segments_list).
        """
        if not audio_path.exists():
            raise FileNotFoundError(f"Audio file not found: {audio_path}")

        logger.info(f"Starting transcription for {audio_path}")
        start_time = time.time()
        
        segments, info = self.model.transcribe(str(audio_path), beam_size=5)

        logger.info(f"Detected language '{info.language}' with probability {info.language_probability}")

        # segments is a generator, so we need to iterate to get results
        segment_list = []
        full_text_parts = []
        
        for segment in segments:
            segment_data = {
                "start": segment.start,
                "end": segment.end,
                "text": segment.text.strip()
            }
            segment_list.append(segment_data)
            full_text_parts.append(segment.text.strip())
            # Optional: Log progress periodically if needed
            # logger.debug(f"Transcribed segment: {segment.start:.2f}-{segment.end:.2f}")

        full_text = " ".join(full_text_parts)
        
        duration = time.time() - start_time
        logger.info(f"Transcription completed in {duration:.2f}s")
        
        return {
            "text": full_text,
            "segments": segment_list,
            "language": info.language,
            "language_probability": info.language_probability
        }
