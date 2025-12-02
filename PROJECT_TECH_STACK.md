# CAPTION.AI - Technical Documentation

## 📋 Project Overview

**CAPTION.AI** is a full-stack web application that automatically generates time-synchronized subtitles for videos using speech recognition, with customizable styling options (font size and color). Users can upload videos, generate captions, customize appearance, and download the final video with burned-in subtitles.

---

## 🏗️ Architecture

### System Design
```
Frontend (Next.js on Vercel)
    ↓ HTTP Requests
Backend API (FastAPI on Render)
    ↓ Processing
FFmpeg + Google Speech Recognition
    ↓ Output
Final Video with Subtitles
```

### Workflow
1. **Upload**: User uploads video file (max 20 MB)
2. **Extract Audio**: FFmpeg extracts audio from video
3. **Transcribe**: Google Speech Recognition converts audio to text in 3-second chunks
4. **Generate SRT**: Creates subtitle file with timestamps
5. **Customize**: User selects font size (16-48px) and color
6. **Burn Subtitles**: FFmpeg encodes video with styled subtitles
7. **Download**: User downloads final video

---

## 💻 Frontend Technologies

### 1. **Next.js 16.0.3** (React Framework)
- **Purpose**: Full-stack React framework for building the UI
- **Why Used**: 
  - Server-side rendering (SSR) and static site generation (SSG)
  - Built-in routing system
  - Excellent developer experience with hot reload
  - Optimized for production with automatic code splitting
- **Key Features Used**:
  - App Router (new routing system)
  - Client components (`"use client"`)
  - Built-in TypeScript support

**Interview Question**: *"Why Next.js over plain React?"*
**Answer**: Next.js provides server-side rendering, automatic routing, better SEO, and production optimizations out of the box. For a video processing app, the built-in API routes and optimized bundling improve performance.

---

### 2. **React 19** (UI Library)
- **Purpose**: Component-based UI library
- **Why Used**: 
  - Declarative UI development
  - State management with hooks
  - Component reusability
- **Key Hooks Used**:
  - `useState`: Managing component state (file, progress, fontSize, fontColor)
  - `useEffect`: Side effects (would be used for cleanup if needed)

**Interview Question**: *"How did you manage state?"*
**Answer**: Used React's `useState` for local component state. Each piece of data (selectedFile, videoFilename, subtitles, fontSize, fontColor) has its own state variable. For session management, we use localStorage with UUID generation.

---

### 3. **TypeScript** (Type Safety)
- **Purpose**: Adds static typing to JavaScript
- **Why Used**:
  - Catch errors at compile time
  - Better IDE autocomplete
  - Self-documenting code
- **Example**:
```typescript
const [fontSize, setFontSize] = useState<number>(24);
const [subtitles, setSubtitles] = useState<any[]>([]);
```

**Interview Question**: *"Why TypeScript?"*
**Answer**: TypeScript catches type-related bugs during development rather than runtime. For a project with complex data flow (video metadata, subtitles, API responses), types ensure data consistency.

---

### 4. **Tailwind CSS 4** (Styling)
- **Purpose**: Utility-first CSS framework
- **Why Used**:
  - Rapid UI development with utility classes
  - Consistent design system
  - No CSS file management needed
- **Design Features**:
  - Dark mode with neon green gradient theme
  - Glassmorphism effects (backdrop-blur)
  - Custom animations (pulse, scale transitions)
  - Responsive design

**Interview Question**: *"Why Tailwind over traditional CSS?"*
**Answer**: Tailwind's utility classes allow faster prototyping without context switching. The built-in design tokens ensure consistency, and purging unused styles keeps the bundle small in production.

---

### 5. **Axios 1.x** (HTTP Client)
- **Purpose**: Promise-based HTTP client
- **Why Used over fetch**:
  - Automatic JSON transformation
  - Request/response interceptors
  - Timeout configuration
  - Better error handling
- **Example**:
```typescript
const res = await axios.post(`${API_URL}/generate-captions`, {}, {
  headers: { "X-Session-Id": sessionId },
  timeout: 180000, // 3 minutes
});
```

**Interview Question**: *"Why Axios over fetch API?"*
**Answer**: Axios provides built-in timeout support, automatic JSON parsing, and cleaner syntax for headers. For our long-running video processing requests, the timeout configuration was essential.

---

### 6. **UUID (uuid v4)** (Session Management)
- **Purpose**: Generate unique session identifiers
- **Why Used**:
  - Stateless session tracking
  - No database needed for demo
  - Isolate user uploads
- **Implementation**:
```typescript
// lib/session.js
export function getSessionId() {
  let sessionId = localStorage.getItem('sessionId');
  if (!sessionId) {
    sessionId = uuidv4();
    localStorage.setItem('sessionId', sessionId);
  }
  return sessionId;
}
```

**Interview Question**: *"How do you track user sessions?"*
**Answer**: Each user gets a unique UUID stored in localStorage. This ID is sent with every API request to isolate their files in separate backend folders. Sessions expire after 30 minutes of inactivity.

---

## 🔧 Backend Technologies

### 7. **FastAPI 0.121.3** (Python Web Framework)
- **Purpose**: Modern async web framework for building APIs
- **Why Used**:
  - Automatic API documentation (Swagger UI)
  - Built-in data validation with Pydantic
  - High performance (comparable to Node.js)
  - Async support for concurrent requests
- **Key Features**:
  - Path operations with type hints
  - Automatic request validation
  - Dependency injection
  - Built-in CORS middleware

**Interview Question**: *"Why FastAPI over Flask/Django?"*
**Answer**: FastAPI offers automatic API docs, async support, and type-based validation. For a video processing app, async operations allow handling multiple uploads without blocking. The automatic documentation helped during development.

---

### 8. **Uvicorn 0.38.0** (ASGI Server)
- **Purpose**: Lightning-fast ASGI server for running FastAPI
- **Why Used**:
  - High performance async server
  - Production-ready
  - WebSocket support (if needed later)
- **Command**:
```bash
uvicorn main:app --host 0.0.0.0 --port 8000
```

**Interview Question**: *"What's the difference between ASGI and WSGI?"*
**Answer**: ASGI (Asynchronous Server Gateway Interface) supports async/await, allowing concurrent request handling. WSGI is synchronous. Since our app has long-running processes (video encoding), async support prevents blocking.

---

### 9. **python-multipart** (File Upload Handler)
- **Purpose**: Parse multipart form data for file uploads
- **Why Used**:
  - Required by FastAPI for handling `UploadFile`
  - Streams large files without loading into memory
  - Prevents memory overflow on large uploads

**Interview Question**: *"How do you handle large file uploads?"*
**Answer**: We use FastAPI's `UploadFile` with python-multipart, which streams files in chunks (1MB at a time) to disk. This prevents memory issues. We also validate file size (20 MB limit) before processing.

---

### 10. **FFmpeg-python 0.2.0** (Video Processing)
- **Purpose**: Python wrapper for FFmpeg
- **Why Used**:
  - Extract audio from video
  - Burn subtitles into video
  - Re-encode with custom styling
- **Key Operations**:
```python
# Extract audio
ffmpeg.input(video_path).output(audio_path, format='wav').run()

# Burn subtitles with styling
ffmpeg.input(video_path).output(
    output_path,
    vf=f"subtitles={srt_path}:force_style='FontSize={size},PrimaryColour=&H{color}&'",
    vcodec="libx264",
    acodec="aac",
    preset="ultrafast"
).run()
```

**Interview Question**: *"How do you process videos?"*
**Answer**: We use FFmpeg through its Python wrapper. First, we extract audio in WAV format for speech recognition. After generating subtitles, we use FFmpeg's subtitle filter to burn them into the video with custom font size and color using the force_style parameter.

---

### 11. **SpeechRecognition 3.14.4** (Audio Transcription)
- **Purpose**: Convert speech to text
- **Why Used**:
  - Free Google Speech Recognition API
  - No API key required for basic use
  - Good accuracy for English
- **Why Not OpenAI Whisper?**:
  - Whisper doesn't support Python 3.14 (our version)
  - Google Speech API is free and sufficient
- **Implementation**:
```python
recognizer = sr.Recognizer()
with sr.AudioFile(chunk_path) as source:
    audio = recognizer.record(source)
    text = recognizer.recognize_google(audio)
```

**Interview Question**: *"Why Google Speech Recognition over Whisper?"*
**Answer**: Initially planned Whisper, but it has Python version constraints. Google's API is free, requires no API key, and provides good accuracy. For production, we could switch to Whisper or paid APIs for better accuracy.

---

### 12. **Pydub 0.25.1** (Audio Manipulation)
- **Purpose**: Audio file manipulation in Python
- **Why Used**:
  - Split audio into 3-second chunks
  - Export chunks for transcription
  - Simple API for audio operations
- **Chunking Logic**:
```python
audio = AudioSegment.from_wav(audio_path)
chunk_length_ms = 3000  # 3 seconds
for i in range(0, len(audio), chunk_length_ms):
    chunk = audio[i:i + chunk_length_ms]
    chunk.export(chunk_path, format="wav")
    # Transcribe chunk
```

**Interview Question**: *"Why process audio in chunks?"*
**Answer**: Processing 3-second chunks ensures captions are time-synchronized with audio. It also prevents timeout issues with long videos. Each chunk is transcribed separately, and we calculate proportional timestamps for smooth caption display.

---

### 13. **APScheduler 3.11.1** (Background Jobs)
- **Purpose**: Schedule background tasks
- **Why Used**:
  - Automatic cleanup of expired sessions
  - Runs every 30 minutes
  - Frees disk space by deleting old files
- **Implementation**:
```python
from apscheduler.schedulers.background import BackgroundScheduler

def delete_expired_session():
    for folder in TEMP_DIR.iterdir():
        folder_age = now - datetime.fromtimestamp(folder.stat().st_mtime)
        if folder_age > timedelta(minutes=30):
            shutil.rmtree(folder)

scheduler = BackgroundScheduler()
scheduler.add_job(delete_expired_session, "interval", minutes=30)
scheduler.start()
```

**Interview Question**: *"How do you manage temporary files?"*
**Answer**: We use APScheduler to run cleanup every 30 minutes. It checks folder modification times and deletes sessions older than 30 minutes. This prevents disk space buildup on the server.

---

### 14. **CORS Middleware** (Cross-Origin Resource Sharing)
- **Purpose**: Allow frontend (Vercel) to call backend (Render)
- **Configuration**:
```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",  # Development
        os.getenv("FRONTEND_URL")  # Production
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

**Interview Question**: *"What are CORS and why do you need it?"*
**Answer**: CORS prevents browsers from blocking cross-origin requests. Since our frontend (Vercel) and backend (Render) are on different domains, we configure CORS to allow specific origins, ensuring security while enabling communication.

---

## 📦 Development & Deployment

### 15. **Git & GitHub** (Version Control)
- **Branching Strategy**:
  - `main`: Production-ready code
  - `atul-dev`: Development branch
  - Pull requests for merging features
- **Key Commands Used**:
```bash
git checkout -b feature-branch
git merge main
git push origin atul-dev
```

---

### 16. **Vercel** (Frontend Hosting)
- **Purpose**: Deploy Next.js application
- **Why Vercel**:
  - Built for Next.js (same company)
  - Automatic deployments from GitHub
  - Global CDN for fast loading
  - Free tier with generous limits
- **Configuration**:
  - Root Directory: `frontend`
  - Environment Variable: `NEXT_PUBLIC_API_URL`
  - Auto-deploy on push

**Interview Question**: *"Why Vercel for deployment?"*
**Answer**: Vercel is optimized for Next.js with zero-config deployments. It provides automatic HTTPS, global CDN, and preview deployments for each PR. The free tier is perfect for projects like this.

---

### 17. **Render** (Backend Hosting)
- **Purpose**: Deploy FastAPI application
- **Why Render**:
  - Free tier with 750 hours/month
  - FFmpeg pre-installed
  - Auto-deploy from GitHub
  - Easy environment variable management
- **Configuration**:
  - Build: `pip install -r requirements.txt`
  - Start: `uvicorn main:app --host 0.0.0.0 --port $PORT`
  - Environment: `FRONTEND_URL`

**Interview Question**: *"Why Render over Heroku?"*
**Answer**: Render offers a free tier with better resource limits than Heroku's free plan (which was discontinued). It has FFmpeg pre-installed, which is essential for our video processing. Auto-deployment from GitHub simplifies CI/CD.

---

### 18. **Docker** (Containerization - Optional)
- **Purpose**: Package application with dependencies
- **Dockerfile**:
```dockerfile
FROM python:3.13-slim
RUN apt-get update && apt-get install -y ffmpeg
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

**Interview Question**: *"Why use Docker?"*
**Answer**: Docker ensures consistent environments across development and production. It bundles FFmpeg and Python dependencies, eliminating "works on my machine" issues. While we use Render's native Python support, Docker provides deployment flexibility.

---

## 🎯 Key Technical Decisions

### Why This Stack?

1. **Next.js + FastAPI**: Separation of concerns - React for UI, Python for heavy processing
2. **TypeScript**: Type safety prevents runtime errors
3. **Tailwind**: Rapid UI development with consistent design
4. **FFmpeg**: Industry-standard video processing
5. **Google Speech API**: Free, no API key, good accuracy
6. **Session-based Architecture**: Stateless, scalable, no database needed for MVP

### Performance Optimizations

1. **Chunked Audio Processing**: 3-second chunks prevent memory overflow
2. **FFmpeg Ultrafast Preset**: Faster encoding (crf=23 for quality)
3. **Streaming File Upload**: 1MB chunks prevent memory issues
4. **Axios Timeouts**: 3-5 minute timeouts for long processes
5. **20 MB File Limit**: Ensures processing completes within free tier limits

### Security Considerations

1. **File Type Validation**: Only video files accepted
2. **File Size Limits**: Prevent abuse and resource exhaustion
3. **Session Isolation**: Each user's files in separate directories
4. **CORS Configuration**: Whitelist specific frontend origins
5. **Automatic Cleanup**: Delete old sessions to free disk space

---

## 🚀 API Endpoints

### Backend Routes

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/health` | Health check |
| POST | `/upload-video` | Upload video file |
| POST | `/generate-captions` | Generate SRT subtitles |
| POST | `/generate-captioned-video` | Burn subtitles into video |
| GET | `/download` | Download final video |

### Request/Response Flow

```
1. POST /upload-video
   Headers: X-Session-Id
   Body: FormData with video file
   Response: { filename: "uuid.mp4" }

2. POST /generate-captions
   Headers: X-Session-Id, X-Video-Filename
   Response: { subtitle_file: "subtitles.srt", subtitles: [...] }

3. POST /generate-captioned-video
   Headers: X-Session-Id, X-Video-Filename, X-Subtitle-Filename,
            X-Font-Size, X-Font-Color
   Response: { output_file: "final_captioned_video.mp4" }

4. GET /download?session_id=xxx&filename=xxx
   Response: Video file stream
```

---

## 📊 Project Statistics

- **Frontend**: ~380 lines of TypeScript/React
- **Backend**: ~185 lines of Python
- **Total Dependencies**: 15+ libraries
- **File Size Limit**: 20 MB
- **Processing Time**: 1-3 minutes (depending on video length)
- **Deployment**: 2 platforms (Vercel + Render)
- **Cost**: $0/month (Free tier)

---

## 🎤 Common Interview Questions & Answers

### Q1: "Walk me through the entire application flow"
**Answer**: User uploads a video → Backend saves it with UUID → FFmpeg extracts audio → Pydub splits audio into 3-second chunks → Google Speech API transcribes each chunk → We generate SRT file with timestamps → User customizes font size/color → FFmpeg burns subtitles into video with custom styling → User downloads final video

### Q2: "What was the biggest technical challenge?"
**Answer**: Time-synchronizing captions with audio. Initial implementation showed all text at once. Solution: Split audio into 3-second chunks, transcribe each separately, then split long texts into max 10-word segments with proportional timestamps. This ensures smooth caption display.

### Q3: "How would you scale this application?"
**Answer**: 
- Add Redis for session caching
- Use AWS S3 for file storage instead of local temp
- Implement job queue (Celery/RabbitMQ) for async processing
- Add user authentication and database
- Deploy multiple backend instances with load balancer
- Use paid Render plan or AWS EC2 for better resources

### Q4: "What would you improve if you had more time?"
**Answer**:
- Replace Google Speech with Whisper for better accuracy
- Add subtitle editing interface
- Support multiple languages
- Add video preview with live caption display
- Implement progress bars for long processes
- Add unit tests (pytest for backend, Jest for frontend)
- Support larger files with chunked upload

### Q5: "How do you handle errors?"
**Answer**: 
- Frontend: try-catch blocks with user-friendly messages
- Backend: HTTPException with proper status codes
- Timeout handling: 3-5 minute timeouts with clear error messages
- File validation: Size and type checks before processing
- Logging: Console logs for debugging production issues

---

## 📚 Learning Resources

If interviewer asks how you learned these:
- **Next.js**: Official docs + Vercel tutorials
- **FastAPI**: Official documentation (excellent quality)
- **FFmpeg**: Community guides + Stack Overflow
- **Deployment**: Platform-specific docs (Vercel, Render)
- **Speech Recognition**: Library documentation + experimentation

---

## 🎯 Key Takeaways for Interview

1. **Problem-Solving**: Overcame Python 3.14 incompatibility by switching from Whisper to Google Speech API
2. **Performance**: Optimized with chunked processing and faster encoding
3. **User Experience**: Added real-time feedback, file size validation, and custom styling
4. **Deployment**: Successfully deployed full-stack app on free tier
5. **Scalability**: Designed with stateless architecture for easy horizontal scaling

---

**Project Links:**
- Frontend: https://caption-indol.vercel.app
- Backend: https://caption-5huu.onrender.com
- GitHub: https://github.com/Atulkumarjha/Caption

**Tech Stack Summary:**
Frontend: Next.js 16 + React 19 + TypeScript + Tailwind CSS 4 + Axios
Backend: FastAPI + Python 3.14 + FFmpeg + Google Speech Recognition
Deployment: Vercel + Render
Version Control: Git + GitHub
