import ffmpeg
from pathlib import Path
import speech_recognition as sr
from pydub import AudioSegment
from pydub.silence import split_on_silence


def extract_audio(video_path: Path, output_dir: Path) -> Path:
    audio_path = output_dir / "audio.wav"

    (
        ffmpeg.input(str(video_path))
        .output(str(audio_path), ac=1, ar="16000")
        .overwrite_output()
        .run(quiet=True)
    )

    return audio_path


def generate_subtitles(audio_path: Path, output_dir: Path) -> Path:
    srt_path = output_dir / "subtitles.srt"
    recognizer = sr.Recognizer()
    
    try:
        # Load audio file
        audio = AudioSegment.from_wav(str(audio_path))
        total_duration = len(audio) / 1000.0  # Total duration in seconds
        
        # Split audio into smaller 3-second chunks for better sync
        chunk_length_ms = 3000  # 3 seconds per chunk
        chunks = []
        
        for i in range(0, len(audio), chunk_length_ms):
            chunk = audio[i:i + chunk_length_ms]
            chunks.append((i / 1000.0, chunk))  # Store start time with chunk
        
        subtitles = []
        subtitle_index = 1
        
        for start_time, chunk in chunks:
            # Export chunk to temporary file
            chunk_path = output_dir / f"chunk_temp.wav"
            chunk.export(str(chunk_path), format="wav")
            
            # Recognize speech in chunk
            with sr.AudioFile(str(chunk_path)) as source:
                audio_data = recognizer.record(source)
                try:
                    text = recognizer.recognize_google(audio_data)
                    
                    if text.strip():  # Only add if there's actual text
                        # Calculate end time for this chunk
                        chunk_duration = len(chunk) / 1000.0
                        end_time = min(start_time + chunk_duration, total_duration)
                        
                        # Split long text into smaller subtitle segments (max 10 words per subtitle)
                        words = text.split()
                        words_per_subtitle = 10
                        
                        for j in range(0, len(words), words_per_subtitle):
                            word_batch = words[j:j + words_per_subtitle]
                            subtitle_text = ' '.join(word_batch)
                            
                            # Calculate proportional timing for this word batch
                            batch_start = start_time + (j / len(words)) * chunk_duration
                            batch_end = start_time + ((j + len(word_batch)) / len(words)) * chunk_duration
                            batch_end = min(batch_end, end_time)
                            
                            subtitles.append({
                                'index': subtitle_index,
                                'start': format_timestamp(batch_start),
                                'end': format_timestamp(batch_end),
                                'text': subtitle_text
                            })
                            subtitle_index += 1
                    
                except sr.UnknownValueError:
                    # Speech not recognized in this chunk, skip
                    pass
                except sr.RequestError as e:
                    print(f"Could not request results from Google Speech Recognition; {e}")
            
            # Clean up chunk file
            if chunk_path.exists():
                chunk_path.unlink()
        
        # Write SRT file
        with open(srt_path, "w", encoding="utf-8") as f:
            for sub in subtitles:
                f.write(f"{sub['index']}\n")
                f.write(f"{sub['start']} --> {sub['end']}\n")
                f.write(f"{sub['text']}\n\n")
        
        # If no subtitles generated, create a default one
        if not subtitles:
            with open(srt_path, "w", encoding="utf-8") as f:
                f.write("1\n")
                f.write("00:00:00,000 --> 00:00:05,000\n")
                f.write("No speech detected in video\n\n")
                
    except Exception as e:
        # If anything fails, create error subtitle
        with open(srt_path, "w", encoding="utf-8") as f:
            f.write("1\n")
            f.write("00:00:00,000 --> 00:00:05,000\n")
            f.write(f"Error generating captions: {str(e)}\n\n")
    
    return srt_path


def format_timestamp(seconds: float) -> str:
    """Convert seconds to SRT timestamp format (HH:MM:SS,mmm)"""
    hrs = int(seconds // 3600)
    mins = int((seconds % 3600) // 60)
    secs = seconds % 60
    millis = int((secs % 1) * 1000)
    secs = int(secs)
    return f"{hrs:02d}:{mins:02d}:{secs:02d},{millis:03d}"


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
