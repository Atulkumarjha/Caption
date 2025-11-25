from Caption_utils import extract_audio, generate_subtitles, burn_subtitles
from fastapi import FastAPI, UploadFile, File, Header, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pathlib import Path
import uuid

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

TEMP_DIR = Path("temp")
TEMP_DIR.mkdir(exist_ok=True)


def get_session_dir(session_id: str) -> Path:
    safe_id = session_id.replace("/", "")
    session_path = TEMP_DIR / safe_id
    session_path.mkdir(exist_ok=True)
    return session_path


@app.get("/health")
def health_check():
    return {"status": "ok", "message": "Backend is running"}


@app.post("/upload")
async def upload_video(
    file: UploadFile = File(...),
    session_id: str = Header(..., alias="X-Session-Id"),
):

    if not file.content_type.startswith("video/"):
        raise HTTPException(status_code=400, detail="Only video files are allowed.")

    session_folder = get_session_dir(session_id)

    ext = Path(file.filename).suffix or ".mp4"
    video_uuid = str(uuid.uuid4())
    saved_path = session_folder / f"{video_uuid}{ext}"

    with open(saved_path, "wb") as out_file:
        while chunk := await file.read(1024 * 1024):
            out_file.write(chunk)

    return {
        "status": "ok",
        "message": "Video uploaded successfully.",
        "video_id": video_uuid,
        "filename": saved_path.name,
    }

@app.post("/generate-captions")
def gneerate_captions(
        session_id: str = Header(..., alias="X-Session-Id"),
        video_filename: str = Header(..., alias="X-Video-filename"),
    ):

        session_folder = get_session_dir(session_id)
        video_path = session_folder / video_filename

        if not video_path.exists():
            raise HTTPException(
                status_code=404, detail="Video not found for this session."
            )

        audio_path = extract_audio(video_path, session_folder)

        srt_path = generate_subtitles(audio_path, session_folder)

        return {
            "status": "ok",
            "message": "Subtitles generated successfully.",
            "subtitle_file": srt_path.name,
        }
        
        
@app.post("/generate-captioned-video")
def generate_captioned_video(
    session_id: str = Header(..., alias="X-Session-Id"),
    video_filename: str = Header(..., alias="X-Video-Filename"),
    subtitle_path: str = Header(..., alias="X-Subtitle-Filename")
):
    
    session_folder = get_session_dir(session_id)
    video_path = session_folder / video_filename
    subtitle_path: str = Header(..., alias="X-Subtitle-Filename")
    
    if not video_path.exists():
        raise HTTPException(status_code=404, detail="Video not found.")
    
    if not subtitle_path.exists():
        raise HTTPException(status_code=404, detail="Subtitle file not found.")
    
    output_video = burn_subtitles(video_path, subtitle_path, session_folder)
    
    return {
        "status": "ok",
        "message": "Captioned video generated successfully.",
        "output_file": output_video.name
    }
    
@app.get("/download")
def download_video(
    session_id: str,
    filename: str,
):
    
    session_folder = get_session_dir(session_id)
    file_path = session_folder / filename
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="File not found.")
    
    return FileResponse(
        file_path,
        media_type="video/mp4",
        filename=filename
    )