# CAPTION.AI

Next-Gen AI-powered video captioning with customizable styling.

## Features

- 🎬 Automatic speech recognition and subtitle generation
- 🎨 Customizable font size (16-48px) and colors
- ⚡ Real-time preview of caption styling
- 🔄 Session-based processing
- 📥 Direct video download with embedded captions

## Tech Stack

**Frontend:**
- Next.js 16
- React 19
- TypeScript
- Tailwind CSS 4

**Backend:**
- FastAPI (Python)
- Google Speech Recognition
- FFmpeg for video processing
- APScheduler for session cleanup

## Local Development

### Backend Setup

```bash
cd backend

# Install Python dependencies
pip install -r requirements.txt

# Install FFmpeg (macOS)
brew install ffmpeg

# Run backend server
python3 -m uvicorn main:app --reload --port 8000
```

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Run development server
npm run dev
```

Frontend runs on: `http://localhost:3000`
Backend runs on: `http://127.0.0.1:8000`

## Deployment

### Frontend (Vercel)

1. Push code to GitHub
2. Import project in [Vercel](https://vercel.com)
3. Set root directory to `frontend`
4. Deploy

### Backend (Render/Railway)

#### Render:
1. Create new Web Service on [Render](https://render.com)
2. Connect GitHub repository
3. Root directory: `backend`
4. Build command: `pip install -r requirements.txt`
5. Start command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
6. Add environment variable: `PYTHON_VERSION=3.13.0`

#### Railway:
1. Create new project on [Railway](https://railway.app)
2. Connect GitHub repository
3. Root directory: `backend`
4. Railway auto-detects Python and deploys

### Environment Variables

Update frontend API URL in production:
- Open `frontend/app/page.tsx`
- Replace `http://127.0.0.1:8000` with your deployed backend URL

## Project Structure

```
caption/
├── backend/
│   ├── main.py              # FastAPI app & endpoints
│   ├── caption_utils.py     # Video processing logic
│   ├── requirements.txt     # Python dependencies
│   └── temp/               # Session files (gitignored)
├── frontend/
│   ├── app/
│   │   ├── page.tsx        # Main UI component
│   │   ├── layout.tsx      # App layout
│   │   └── globals.css     # Global styles
│   └── lib/
│       └── session.js      # Session management
└── README.md
```

## API Endpoints

- `POST /upload-video` - Upload video file
- `POST /generate-captions` - Generate subtitles with speech recognition
- `POST /generate-captioned-video` - Burn captions into video with custom styling
- `GET /download` - Download final video

## Contributing

Made with ❤️ by [Atul Kumar Jha](https://github.com/Atulkumarjha)

## License

MIT License
