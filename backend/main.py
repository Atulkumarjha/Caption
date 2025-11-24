from fastapi import FastAPI, UploadFile, File, Header, HTTPException
from fastapi.middleware.cors import CORSMiddleware
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