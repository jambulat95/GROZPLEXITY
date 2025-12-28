# Backend - Video Reverse Engineering AI

## Prerequisites

1. **System Dependencies:**
   - You must have `ffmpeg` installed on your system.
   - macOS: `brew install ffmpeg`
   - Ubuntu: `sudo apt install ffmpeg`
   - Windows: Download from ffmpeg.org and add to PATH.

2. **Python:**
   - Python 3.11+ is recommended.

## Installation

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Create a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

## Running the Server

Start the server with hot-reload enabled:

```bash
uvicorn app.main:app --reload
```

The API will be available at:
- URL: `http://localhost:8000`
- Documentation (Swagger UI): `http://localhost:8000/docs`

## Usage

**Endpoint:** `POST /api/v1/analyze`

**Request Body:**
```json
{
  "url": "https://www.youtube.com/shorts/..."
}
```

**Response:**
Returns video ID, transcription text, segments, and paths to downloaded/generated files.

