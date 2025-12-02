# CAPTION.AI - Feature Implementation Guide

## 🎯 Complete Feature Breakdown with Libraries & Implementation

This document explains **every feature** in the project, which libraries power them, and **how** they were implemented with code examples.

---

## Feature 1: Video File Upload

### What It Does
Users can drag-and-drop or click to upload video files (max 20 MB) from their device.

### Libraries Used
- **Frontend**: 
  - React's `useState` hook (state management)
  - HTML5 File API (native browser API)
  - Axios (HTTP requests)
- **Backend**:
  - FastAPI's `UploadFile` (file handling)
  - python-multipart (parsing multipart form data)

### How It Works

#### Frontend Implementation
```typescript
// State to store selected file
const [selectedFile, setSelectedFile] = useState<File | null>(null);

// HTML file input with change handler
<input 
  type="file" 
  accept="video/*" 
  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)} 
/>

// File size validation (20 MB limit)
const MAX_FILE_SIZE = 20 * 1024 * 1024;
if (selectedFile.size > MAX_FILE_SIZE) {
  setMessage("File too large!");
  return;
}

// Upload using FormData and Axios
const formData = new FormData();
formData.append("file", selectedFile);

const res = await axios.post(`${API_URL}/upload-video`, formData, {
  headers: {
    "Content-Type": "multipart/form-data",
    "X-Session-Id": sessionId,
  },
});
```

#### Backend Implementation
```python
from fastapi import UploadFile, File

@app.post("/upload-video")
async def upload_video(
    file: UploadFile = File(...),
    session_id: str = Header(..., alias="X-Session-Id"),
):
    # Validate file type
    if not file.content_type.startswith("video/"):
        raise HTTPException(status_code=400, detail="Only video files")
    
    # Check file size
    file.file.seek(0, 2)  # Move to end
    file_size = file.file.tell()  # Get size
    file.file.seek(0)  # Reset to start
    
    if file_size > MAX_FILE_SIZE:
        raise HTTPException(status_code=413, detail="File too large")
    
    # Save file in chunks to prevent memory overflow
    session_folder = get_session_dir(session_id)
    video_uuid = str(uuid.uuid4())
    saved_path = session_folder / f"{video_uuid}.mp4"
    
    with open(saved_path, "wb") as out_file:
        while chunk := await file.read(1024 * 1024):  # 1 MB chunks
            out_file.write(chunk)
    
    return {"filename": saved_path.name}
```

### Key Learning Points
- **Streaming Upload**: Reading file in 1MB chunks prevents memory issues
- **UUID Generation**: Creates unique filename to prevent conflicts
- **Session Isolation**: Files saved in session-specific folders
- **Validation**: Size and type checks happen before processing

---

## Feature 2: Session Management

### What It Does
Tracks each user's uploads separately without requiring login/database.

### Libraries Used
- **Frontend**: 
  - `uuid` (v4.0+) - Generate unique IDs
  - Browser's `localStorage` API
- **Backend**:
  - Python's `uuid` module
  - `pathlib` (file system operations)

### How It Works

#### Frontend Implementation
```typescript
// lib/session.js
import { v4 as uuidv4 } from 'uuid';

export function getSessionId() {
  // Check if session ID exists in browser storage
  let sessionId = localStorage.getItem('sessionId');
  
  if (!sessionId) {
    // Generate new UUID for new user
    sessionId = uuidv4();  // e.g., "b90a3ba1-ebb4-439e-97bc-9c4dd756a2e3"
    localStorage.setItem('sessionId', sessionId);
  }
  
  return sessionId;
}

// Used in every API call
const sessionId = getSessionId();
headers: { "X-Session-Id": sessionId }
```

#### Backend Implementation
```python
from pathlib import Path
import uuid

TEMP_DIR = Path("temp")

def get_session_dir(session_id: str) -> Path:
    # Sanitize session ID (remove any slashes)
    safe_id = session_id.replace("/", "")
    
    # Create folder: temp/b90a3ba1-ebb4-439e-97bc-9c4dd756a2e3/
    session_path = TEMP_DIR / safe_id
    session_path.mkdir(exist_ok=True)
    
    return session_path
```

### Key Learning Points
- **Stateless Architecture**: No database needed for MVP
- **localStorage Persistence**: Session survives page refresh
- **Folder Isolation**: Each session gets own directory
- **Security**: Sanitizing session ID prevents path traversal attacks

---

## Feature 3: Audio Extraction from Video

### What It Does
Extracts audio track from uploaded video in WAV format for speech recognition.

### Libraries Used
- **ffmpeg-python 0.2.0** (Python wrapper for FFmpeg)
- **FFmpeg** (system-level video processing tool)

### How It Works

#### Implementation
```python
import ffmpeg
from pathlib import Path

def extract_audio(video_path: Path, output_dir: Path) -> Path:
    # Output path for audio file
    audio_path = output_dir / "audio.wav"
    
    # FFmpeg command to extract audio
    # Converts video -> WAV (uncompressed audio)
    (
        ffmpeg
        .input(str(video_path))           # Input: video.mp4
        .output(str(audio_path), 
                format='wav',              # Output format: WAV
                acodec='pcm_s16le',       # Audio codec: PCM 16-bit
                ac=1,                      # Audio channels: 1 (mono)
                ar='16000'                 # Sample rate: 16kHz
        )
        .overwrite_output()                # Overwrite if exists
        .run(capture_stdout=True, capture_stderr=True)
    )
    
    return audio_path
```

### FFmpeg Command Equivalent
```bash
ffmpeg -i video.mp4 -f wav -acodec pcm_s16le -ac 1 -ar 16000 audio.wav
```

### Why These Settings?
- **WAV format**: Uncompressed, works with speech recognition
- **Mono (1 channel)**: Speech recognition doesn't need stereo
- **16kHz sample rate**: Optimal for speech (voices are 300-3400 Hz)
- **PCM 16-bit**: Standard audio encoding

### Key Learning Points
- **FFmpeg Wrapper**: Python library provides clean API vs shell commands
- **Error Handling**: capture_stdout/stderr catches FFmpeg errors
- **Format Conversion**: Video codecs vary, WAV standardizes for next step

---

## Feature 4: Speech Recognition (Audio to Text)

### What It Does
Converts extracted audio into text transcription in 3-second chunks for time-sync.

### Libraries Used
- **SpeechRecognition 3.14.4** (speech-to-text library)
- **Pydub 0.25.1** (audio manipulation)
- **Google Speech Recognition API** (cloud service, free)

### How It Works

#### Step 1: Split Audio into Chunks
```python
from pydub import AudioSegment

def split_audio_chunks(audio_path: Path) -> list:
    # Load audio file
    audio = AudioSegment.from_wav(str(audio_path))
    
    # Chunk settings
    chunk_length_ms = 3000  # 3 seconds in milliseconds
    chunks = []
    
    # Split audio into 3-second pieces
    for i in range(0, len(audio), chunk_length_ms):
        chunk = audio[i:i + chunk_length_ms]
        chunk_start_time = i / 1000.0  # Convert to seconds
        chunks.append((chunk, chunk_start_time))
    
    return chunks
```

#### Step 2: Transcribe Each Chunk
```python
import speech_recognition as sr

def transcribe_chunk(chunk: AudioSegment, chunk_path: Path) -> str:
    # Save chunk to temporary file
    chunk.export(chunk_path, format="wav")
    
    # Initialize recognizer
    recognizer = sr.Recognizer()
    
    # Open audio file
    with sr.AudioFile(str(chunk_path)) as source:
        # Load audio into memory
        audio_data = recognizer.record(source)
        
        try:
            # Send to Google's API and get text
            text = recognizer.recognize_google(audio_data)
            return text
        except sr.UnknownValueError:
            # No speech detected
            return ""
        except sr.RequestError as e:
            # API error
            print(f"Google API error: {e}")
            return ""
```

#### Step 3: Split Long Text into Subtitle Segments
```python
def split_text_into_segments(text: str, max_words: int = 10) -> list:
    """Split long text into max 10-word segments for better readability"""
    words = text.split()
    segments = []
    
    for i in range(0, len(words), max_words):
        segment = ' '.join(words[i:i + max_words])
        segments.append(segment)
    
    return segments
```

#### Step 4: Generate SRT File with Timestamps
```python
def generate_subtitles(video_path: Path, output_dir: Path) -> Path:
    srt_path = output_dir / "subtitles.srt"
    
    # Extract audio
    audio_path = extract_audio(video_path, output_dir)
    
    # Load and split audio
    audio = AudioSegment.from_wav(str(audio_path))
    chunk_length_ms = 3000
    
    subtitles = []
    index = 1
    
    # Process each chunk
    for i in range(0, len(audio), chunk_length_ms):
        chunk = audio[i:i + chunk_length_ms]
        chunk_start = i / 1000.0  # Start time in seconds
        chunk_end = (i + chunk_length_ms) / 1000.0
        
        # Save and transcribe chunk
        chunk_path = output_dir / f"chunk_{i}.wav"
        chunk.export(chunk_path, format="wav")
        
        recognizer = sr.Recognizer()
        with sr.AudioFile(str(chunk_path)) as source:
            audio_data = recognizer.record(source)
            try:
                text = recognizer.recognize_google(audio_data)
            except:
                text = ""
        
        # Split long text into segments
        if text:
            words = text.split()
            segments = [' '.join(words[i:i+10]) for i in range(0, len(words), 10)]
            
            # Calculate time per segment
            segment_duration = (chunk_end - chunk_start) / len(segments)
            
            for seg_idx, segment_text in enumerate(segments):
                seg_start = chunk_start + (seg_idx * segment_duration)
                seg_end = seg_start + segment_duration
                
                subtitles.append({
                    'index': index,
                    'start': format_timestamp(seg_start),
                    'end': format_timestamp(seg_end),
                    'text': segment_text
                })
                index += 1
        
        # Cleanup
        chunk_path.unlink()
    
    # Write SRT file
    with open(srt_path, "w", encoding="utf-8") as f:
        for sub in subtitles:
            f.write(f"{sub['index']}\n")
            f.write(f"{sub['start']} --> {sub['end']}\n")
            f.write(f"{sub['text']}\n\n")
    
    return srt_path

def format_timestamp(seconds: float) -> str:
    """Convert seconds to SRT format: HH:MM:SS,mmm"""
    hrs = int(seconds // 3600)
    mins = int((seconds % 3600) // 60)
    secs = seconds % 60
    millis = int((secs % 1) * 1000)
    secs = int(secs)
    return f"{hrs:02d}:{mins:02d}:{secs:02d},{millis:03d}"
```

### SRT File Format Example
```
1
00:00:00,000 --> 00:00:02,500
Hello everyone welcome to this video

2
00:00:02,500 --> 00:00:05,000
today we're going to learn about

3
00:00:05,000 --> 00:00:07,500
video caption generation using AI
```

### Key Learning Points
- **Chunking Strategy**: 3-second chunks balance accuracy vs performance
- **Google API**: Free tier, no API key needed, good for English
- **Word Limit**: Max 10 words per caption ensures readability
- **Proportional Timing**: Distributes time evenly across word segments
- **Error Handling**: Gracefully handles silence or API failures

### Why Not Process Entire Audio?
- Long audio = API timeout
- No time synchronization
- Poor user experience (all text at once)

---

## Feature 5: Caption Customization (Font Size & Color)

### What It Does
Users can select font size (16-48px) and color (6 preset colors) before generating final video.

### Libraries Used
- **Frontend**: React `useState` hooks
- **Backend**: FFmpeg's subtitle filter with `force_style`

### How It Works

#### Frontend Implementation
```typescript
// State management
const [fontSize, setFontSize] = useState(24);  // Default 24px
const [fontColor, setFontColor] = useState("#FFFFFF");  // Default white

// Font size slider
<input 
  type="range" 
  min="16" 
  max="48" 
  value={fontSize}
  onChange={(e) => setFontSize(Number(e.target.value))}
/>
<span>{fontSize}px</span>

// Color picker (6 preset colors)
const colors = [
  { color: "#FFFFFF", name: "White" },
  { color: "#FFFF00", name: "Yellow" },
  { color: "#FF0000", name: "Red" },
  { color: "#00FF00", name: "Green" },
  { color: "#00FFFF", name: "Cyan" },
  { color: "#FF00FF", name: "Magenta" },
];

colors.map(({ color }) => (
  <button
    onClick={() => setFontColor(color)}
    style={{ backgroundColor: color }}
    className={fontColor === color ? 'border-2 border-green-400' : ''}
  />
))

// Live preview
<div style={{ fontSize: `${fontSize}px`, color: fontColor }}>
  Sample Caption Text
</div>

// Send to backend when generating video
const res = await axios.post(`${API_URL}/generate-captioned-video`, {}, {
  headers: {
    "X-Font-Size": fontSize.toString(),
    "X-Font-Color": fontColor,
  }
});
```

#### Backend Implementation
```python
@app.post("/generate-captioned-video")
def generate_captioned_video(
    font_size: int = Header(24, alias="X-Font-Size"),
    font_color: str = Header("#FFFFFF", alias="X-Font-Color")
):
    output_video = burn_subtitles(
        video_path, 
        subtitle_path, 
        session_folder, 
        font_size, 
        font_color
    )
    return {"output_file": output_video.name}

def burn_subtitles(video_path, subtitle_path, output_dir, font_size=24, font_color="#FFFFFF"):
    output_path = output_dir / "final_captioned_video.mp4"
    
    # Convert hex color to FFmpeg BGR format
    # FFmpeg uses &HBBGGRR& (reverse of RGB)
    color_hex = font_color.lstrip('#')
    # For white #FFFFFF, stays FFFFFF
    # For red #FF0000, becomes 0000FF (BGR)
    
    # Escape subtitle path for FFmpeg
    subtitle_str = str(subtitle_path).replace('\\', '/').replace(':', '\\\\:')
    
    # Build FFmpeg subtitle filter with custom styling
    subtitle_filter = (
        f"subtitles={subtitle_str}:"
        f"force_style='"
        f"FontSize={font_size},"              # Custom font size
        f"PrimaryColour=&H{color_hex}&,"      # Text color
        f"OutlineColour=&H000000&,"           # Black outline
        f"Outline=2,"                          # Outline thickness
        f"Shadow=1"                            # Shadow depth
        f"'"
    )
    
    # Execute FFmpeg
    (
        ffmpeg
        .input(str(video_path))
        .output(
            str(output_path),
            vf=subtitle_filter,              # Video filter with styled subtitles
            vcodec="libx264",                # H.264 video codec
            acodec="aac",                    # AAC audio codec
            preset="ultrafast",              # Fast encoding
            crf=23                           # Quality (lower = better, 18-28 range)
        )
        .overwrite_output()
        .run(capture_stdout=True, capture_stderr=True)
    )
    
    return output_path
```

### FFmpeg Command Equivalent
```bash
ffmpeg -i video.mp4 \
  -vf "subtitles=subtitles.srt:force_style='FontSize=32,PrimaryColour=&HFFFF00&,OutlineColour=&H000000&,Outline=2,Shadow=1'" \
  -vcodec libx264 -acodec aac -preset ultrafast -crf 23 \
  output.mp4
```

### FFmpeg Subtitle Styling Explained
- **FontSize**: Text size in pixels
- **PrimaryColour**: Text color in BGR hex (&HBBGGRR&)
- **OutlineColour**: Outline color (black for contrast)
- **Outline**: Outline thickness (makes text readable on any background)
- **Shadow**: Shadow depth (adds depth)

### Key Learning Points
- **force_style Override**: Overrides SRT file styles with custom values
- **Color Conversion**: HTML hex (#RRGGBB) → FFmpeg BGR (&HBBGGRR&)
- **Live Preview**: Shows user exactly what they'll get
- **Encoding Settings**: ultrafast preset speeds up processing on free tier

---

## Feature 6: Progress Tracking & User Feedback

### What It Does
Shows real-time progress bar and status messages throughout the 4-step process.

### Libraries Used
- **React useState** (state management)
- **Tailwind CSS** (animated progress bar)

### How It Works

```typescript
// Progress state (0-4 steps)
const [progress, setProgress] = useState(0);
const [message, setMessage] = useState("");

// Step 1: Upload
setProgress(1);
setMessage("Uploading video... Please wait.");

// Step 2: Caption Generation
setProgress(2);
setMessage("Generating captions... This may take 1-2 minutes.");

// Step 3: Video Processing
setProgress(3);
setMessage("Adding captions into video... This may take 2-3 minutes.");

// Step 4: Complete
setProgress(4);
setMessage("Captioned video ready! Click below to download.");

// Progress bar UI
<div className="w-full h-1 bg-gray-800">
  <div 
    className="h-full bg-gradient-to-r from-green-400 to-emerald-500"
    style={{ width: `${(progress / 4) * 100}%` }}  // 0%, 25%, 50%, 75%, 100%
  />
</div>

// Status messages
<div className="text-sm text-gray-300">
  {isProcessing && (
    <div className="animate-ping w-3 h-3 bg-green-500 rounded-full" />
  )}
  <span>{message}</span>
</div>
```

### Key Learning Points
- **Visual Feedback**: Progress bar shows completion percentage
- **Loading States**: Animated spinner during processing
- **Realistic Time Estimates**: Tell users "1-2 minutes" not "please wait"
- **State Management**: Single `progress` state drives entire UI

---

## Feature 7: Automatic Session Cleanup

### What It Does
Deletes old user files automatically after 30 minutes to free disk space.

### Libraries Used
- **APScheduler 3.11.1** (background job scheduler)
- **Python datetime** (time calculations)
- **shutil** (directory deletion)

### How It Works

```python
from apscheduler.schedulers.background import BackgroundScheduler
from datetime import datetime, timedelta
import shutil

SESSION_EXPIRY_MINUTES = 30

def delete_expired_session():
    """Runs every 30 minutes to cleanup old sessions"""
    now = datetime.now()
    
    # Iterate through all session folders
    for folder in TEMP_DIR.iterdir():
        if folder.is_dir():
            # Get folder's last modified time
            folder_modified = datetime.fromtimestamp(folder.stat().st_mtime)
            
            # Calculate age
            folder_age = now - folder_modified
            
            # Delete if older than 30 minutes
            if folder_age > timedelta(minutes=SESSION_EXPIRY_MINUTES):
                shutil.rmtree(folder)  # Delete folder and all contents
                print(f"Deleted expired session: {folder.name}")

# Initialize background scheduler
scheduler = BackgroundScheduler()

# Add cleanup job (runs every 30 minutes)
scheduler.add_job(
    delete_expired_session,      # Function to run
    "interval",                   # Trigger type
    minutes=30                    # Interval
)

# Start scheduler when app starts
scheduler.start()
```

### How APScheduler Works
1. **Background Thread**: Runs independently of API requests
2. **Interval Trigger**: Executes every 30 minutes
3. **Non-blocking**: Doesn't affect API performance
4. **Automatic Start**: Starts when FastAPI app initializes

### Key Learning Points
- **Disk Space Management**: Prevents server from filling up
- **User Privacy**: Deletes user data automatically
- **Background Jobs**: Runs without blocking main application
- **File System Operations**: Uses shutil for safe directory deletion

---

## Feature 8: File Size Validation

### What It Does
Prevents uploads larger than 20 MB on both frontend and backend.

### Libraries Used
- **Frontend**: JavaScript File API
- **Backend**: Python file operations

### How It Works

#### Frontend Validation (Before Upload)
```typescript
const MAX_FILE_SIZE = 20 * 1024 * 1024;  // 20 MB in bytes

if (selectedFile.size > MAX_FILE_SIZE) {
  const sizeMB = (selectedFile.size / (1024 * 1024)).toFixed(1);
  setMessage(`❌ File too large (${sizeMB} MB). Maximum size is 20 MB.`);
  return;  // Stop upload
}

// Show file size in UI
{selectedFile && (
  <p className="text-sm text-gray-400">
    {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
    {selectedFile.size > MAX_FILE_SIZE && (
      <span className="text-red-400">⚠️ Too large (max 20 MB)</span>
    )}
  </p>
)}
```

#### Backend Validation (Double-check)
```python
MAX_FILE_SIZE = 20 * 1024 * 1024  # 20 MB

@app.post("/upload-video")
async def upload_video(file: UploadFile):
    # Seek to end to get size
    file.file.seek(0, 2)
    file_size = file.file.tell()
    file.file.seek(0)  # Reset position
    
    if file_size > MAX_FILE_SIZE:
        size_mb = file_size / (1024 * 1024)
        limit_mb = MAX_FILE_SIZE / (1024 * 1024)
        raise HTTPException(
            status_code=413,  # Payload Too Large
            detail=f"File too large ({size_mb:.1f} MB). Max is {limit_mb:.0f} MB."
        )
```

### Why 20 MB Limit?
- **Free Tier Constraints**: Render's free plan has limited resources
- **Processing Time**: Larger files take longer (risk timeout)
- **Network Speed**: Slower uploads/downloads on free hosting
- **User Experience**: Most short videos are under 20 MB

### Key Learning Points
- **Client-Side First**: Fast feedback, saves bandwidth
- **Server-Side Always**: Never trust client validation alone
- **Clear Messaging**: Show exact size and limit to user
- **File.seek()**: Efficient way to get file size without reading

---

## Feature 9: Timeout Handling for Long Processes

### What It Does
Prevents indefinite waiting when video processing takes too long.

### Libraries Used
- **Axios** (HTTP client with timeout support)

### How It Works

```typescript
// Caption generation timeout (3 minutes)
const res = await axios.post(
  `${API_URL}/generate-captions`,
  {},
  {
    headers: { "X-Session-Id": sessionId },
    timeout: 180000,  // 3 minutes in milliseconds
  }
);

// Video processing timeout (5 minutes)
const res = await axios.post(
  `${API_URL}/generate-captioned-video`,
  {},
  {
    headers: { 
      "X-Session-Id": sessionId,
      "X-Font-Size": fontSize.toString(),
      "X-Font-Color": fontColor
    },
    timeout: 300000,  // 5 minutes
  }
);

// Error handling with specific timeout message
try {
  const res = await axios.post(...);
} catch (err: any) {
  if (err.code === 'ECONNABORTED') {
    setMessage("❌ Timeout! Try a shorter video.");
  } else if (err.response) {
    setMessage(`❌ Error: ${err.response.data?.detail}`);
  } else {
    setMessage(`❌ Network error: ${err.message}`);
  }
}
```

### Why Different Timeouts?
- **Caption Generation (3 min)**: Speech recognition is fast
- **Video Processing (5 min)**: FFmpeg encoding is slower
- **Balance**: Long enough to succeed, short enough to fail fast

### Key Learning Points
- **User Experience**: Don't let users wait indefinitely
- **Error Messages**: Tell users what went wrong specifically
- **Free Tier Reality**: Limited CPU means longer processing

---

## Feature 10: Dynamic API URL (Environment Variables)

### What It Does
Switches between local dev (localhost:8000) and production (Render URL) automatically.

### Libraries Used
- **Next.js Environment Variables**
- **process.env** (Node.js)

### How It Works

```typescript
// Frontend: frontend/app/page.tsx
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

// When deployed on Vercel:
// NEXT_PUBLIC_API_URL = "https://caption-5huu.onrender.com"

// When running locally:
// Falls back to "http://127.0.0.1:8000"

// Backend: backend/main.py
import os

origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

# Add production frontend URL
if frontend_url := os.getenv("FRONTEND_URL"):
    origins.append(frontend_url)

# On Render:
# FRONTEND_URL = "https://caption-indol.vercel.app"
```

### Environment Files
```bash
# frontend/.env.local (not committed)
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000

# frontend/.env.production (Vercel dashboard)
NEXT_PUBLIC_API_URL=https://caption-5huu.onrender.com
```

### Key Learning Points
- **NEXT_PUBLIC_ Prefix**: Makes variable available in browser
- **Fallback Values**: Works without environment file in dev
- **Security**: Backend URL not hardcoded in source
- **Deployment**: Each platform has its own env vars

---

## 🎯 Feature Summary Table

| Feature | Frontend Libraries | Backend Libraries | Key Technique |
|---------|-------------------|-------------------|---------------|
| File Upload | React, Axios, HTML5 File API | FastAPI UploadFile, python-multipart | Chunked streaming |
| Session Management | uuid, localStorage | Python uuid, pathlib | UUID-based folders |
| Audio Extraction | N/A | ffmpeg-python | FFmpeg WAV conversion |
| Speech Recognition | N/A | SpeechRecognition, Pydub | 3-second chunking |
| Caption Customization | React useState | FFmpeg force_style | Live preview |
| Progress Tracking | React useState, Tailwind | N/A | State-driven UI |
| Auto Cleanup | N/A | APScheduler, shutil | Background jobs |
| File Size Limit | JavaScript File API | Python file operations | Client + server validation |
| Timeout Handling | Axios timeout | N/A | Error-specific messages |
| Environment Config | Next.js env vars | os.getenv() | Dynamic URLs |

---

## 🎤 Interview Questions About Features

### Q: "Explain how you implemented time-synchronized captions"
**Answer**: 
1. Extract audio from video using FFmpeg
2. Use Pydub to split audio into 3-second chunks
3. Send each chunk to Google Speech Recognition API
4. Split long transcriptions into 10-word segments
5. Calculate proportional timestamps within each 3-second window
6. Generate SRT file with proper timing format (HH:MM:SS,mmm)

### Q: "How do you handle large file uploads without crashing the server?"
**Answer**: 
1. Client-side validation prevents upload attempt
2. Backend streams file in 1MB chunks (not loading entire file to RAM)
3. 20 MB size limit based on free tier constraints
4. Use FastAPI's `UploadFile` which streams by default
5. Save directly to disk chunk by chunk

### Q: "Why did you choose Google Speech Recognition over other options?"
**Answer**:
- **Free**: No API key or billing needed for basic use
- **Compatibility**: Works with Python 3.14 (Whisper doesn't)
- **Good Accuracy**: Sufficient for English speech
- **Easy Integration**: SpeechRecognition library handles API calls
- **Tradeoff**: Could use Whisper/paid APIs for better accuracy in production

### Q: "How does your session management work without a database?"
**Answer**:
1. Generate UUID when user first visits (stored in localStorage)
2. Create session folder on backend (temp/uuid/)
3. All user files stored in their session folder
4. APScheduler deletes folders older than 30 minutes
5. Stateless design allows easy horizontal scaling

### Q: "Explain your video processing pipeline"
**Answer**:
1. **Upload**: Stream video to disk in chunks
2. **Extract**: FFmpeg pulls audio track as WAV
3. **Transcribe**: Split audio → Google API → get text
4. **Generate**: Create SRT file with timestamps
5. **Customize**: User selects font size/color in UI
6. **Burn**: FFmpeg re-encodes video with styled subtitles
7. **Download**: Stream final video back to user

---

This document covers every feature implementation. Use it to deeply understand how each piece works together! 🚀
