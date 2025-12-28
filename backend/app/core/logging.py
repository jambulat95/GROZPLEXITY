import logging
import sys

def setup_logging():
    """
    Configure logging to ensure output is visible in Uvicorn/FastAPI.
    """
    # Create a handler that writes to sys.stderr (often more reliable for visibility)
    handler = logging.StreamHandler(sys.stderr)
    handler.setFormatter(logging.Formatter("%(asctime)s - %(name)s - %(levelname)s - %(message)s"))

    # Get the root logger
    root_logger = logging.getLogger()
    root_logger.setLevel(logging.INFO)
    
    # Remove existing handlers to avoid duplicates if reloaded
    if root_logger.hasHandlers():
        root_logger.handlers.clear()
    
    root_logger.addHandler(handler)

    # Also explicitly configure our app logger
    app_logger = logging.getLogger("app")
    app_logger.setLevel(logging.INFO)
    
    # Suppress noisy logs
    logging.getLogger("multipart").setLevel(logging.WARNING)
    logging.getLogger("httpx").setLevel(logging.WARNING)
    logging.getLogger("httpcore").setLevel(logging.WARNING)
    
    # Force stdout/stderr flushing
    sys.stdout.reconfigure(line_buffering=True)
    sys.stderr.reconfigure(line_buffering=True)
