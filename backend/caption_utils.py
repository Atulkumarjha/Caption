import subprocess
import ffmpeg
from pathlib import Path


def extract_audio(video_path: Path, output_dir: Path) -> Path:
    audio_path = output_dir / "audio.wav"

    (
        ffmpeg.input(str(video_path))
        .output(str(audio_path), ac=1, ar="16k")
        .overwrite_output()
        .run(quiet=True)
    )

    return audio_path


def generate_subtitles(audio_path: Path, output_dir: Path) -> Path:
    srt_path = output_dir / "subtitles.srt"
    
    # Use whisper CLI if available, otherwise provide helpful error
    try:
        subprocess.run(
            ["whisper", str(audio_path), "--output_dir", str(output_dir), "--output_format", "srt", "--model", "base"],
            check=True,
            capture_output=True
        )
        
        # Whisper creates a file named after the input audio
        generated_srt = output_dir / f"{audio_path.stem}.srt"
        if generated_srt.exists():
            generated_srt.rename(srt_path)
        
    except FileNotFoundError:
        # Whisper not installed, create a dummy subtitle file
        with open(srt_path, "w") as f:
            f.write("1\n")
            f.write("00:00:00,000 --> 00:00:05,000\n")
            f.write("[Whisper not installed. Install with: pip install openai-whisper]\n\n")
    except subprocess.CalledProcessError as e:
        # Whisper failed, create error subtitle
        with open(srt_path, "w") as f:
            f.write("1\n")
            f.write("00:00:00,000 --> 00:00:05,000\n")
            f.write(f"[Whisper error: {e.stderr.decode() if e.stderr else 'Unknown error'}]\n\n")
    
    return srt_path


def burn_subtitles(video_path: Path, subtitle_path: Path, output_dir: Path) -> Path:
    output_path = output_dir / "final_captioned_video.mp4"
    
    # Escape the subtitle path for ffmpeg filter
    subtitle_str = str(subtitle_path).replace('\\', '/').replace(':', '\\\\:')
    
    (
        ffmpeg.input(str(video_path))
        .output(
            str(output_path),
            vf=f"subtitles={subtitle_str}",
            vcodec="libx264",
            acodec="aac"
        )
        .overwrite_output()
        .run(quiet=True)
    )
    
    return output_path
