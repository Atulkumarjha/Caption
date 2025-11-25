from faster_whisper import WhisperModel
import ffmpeg
from pathlib import Path

model = WhisperModel("base")


def extract_audio(video_path: Path, output_dir: Path) -> Path:
    audio_path = output_dir / "audio.wav"

    (
        ffmpeg.input(str(video_path))
        .output(str(audio_path), sc=1, ar="16k")
        .overwrite_output()
        .run(quiet=True)
    )

    return audio_path


def generate_subtitles(audio_path: Path, output_dir: Path) -> Path:
    segments, _ = model.transcribe(str(audio_path))

    srt_path = output_dir / "subtitles.srt"

    with open(srt_path, "w") as f:
        for idx, seg in enumerate(segments, start=1):
            start = format_timestamp(seg.start)
            end = format_timestamp(seg.end)
            text = seg.text.strip()

            f.write(f"{idx}\n")
            f.write(f"{start} --> {end}\n")
            f.write(f"{text}\n\n")

            return srt_path

        def format_timestamp(seconds: float) -> str:
            hrs = int(seconds // 3600)
            mins = int((seconds % 3600) // 60)
            secs = seconds % 60
            millis = int((secs % 1) * 1000)
            secs = int(secs)

            return f"{hrs:02}:{mins:02}:{secs:02},{millis:03}"
        
        def burn_subtitles(video_path: Path, subtitle_path: Path, output_dir: Path) -> Path:
            output_path = output_dir / "final_captioned_video.mp4"
            
            (
                ffmpeg.input(str(video_path))
                .output(
                    str(output_path),
                    vf= f"subtitles={str(dubtitle_path)}",
                    vcodec="libx264",
                    acodec="abc"
                )
                .verwrite_output()
                .run(quiet=True)
            )
            
            return output_path
