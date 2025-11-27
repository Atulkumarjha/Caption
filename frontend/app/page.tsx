"use client";

import { useState } from "react";
import axios from "axios";
import { getSessionId } from "../lib/session";

export default function Home() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [message, setMessage] = useState("");
  const [uploading, setUploading] = useState(false);
  const [generatingCaptions, setGeneratingCaptions] = useState(false);
  const [generatingFinal, setGeneratingFinal] = useState(false);
  const [finalVideo, setFinalVideo] = useState(null);
  const [progress, setProgress] = useState(0);

  const [videoFilename, setVideoFilename] = useState(null);
  const [subtitleFilename, setSubtitleFilename] = useState(null);

  async function handleUpload() {
    if (!selectedFile) {
      setMessage("Please select a video file first.");
      return;
    }

    const sessionId = getSessionId();
    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
      setUploading(true);
      setProgress(1);
      setMessage("📤 Uploading video... Please wait.");

      const res = await axios.post("http://127.0.0.1:8000/upload-video", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          "X-Session-Id": sessionId,
        },
      }
    );

    setVideoFilename(res.data.filename);
    setMessage("✅ Video uploaded successfully! Ready to generate captions.");
    } catch (err: any) {
      setMessage("❌ Upload failed: " + err.message);
    } finally {
      setUploading(false);
    }
  }

  async function handleGenerateCaptions() {
    const sessionId = getSessionId();

    try {
      setGeneratingCaptions(true);
      setProgress(2);
      setMessage("🎬 Analyzing video and generating subtitles... This may take a moment.");

      const res = await axios.post(
        "http://127.0.0.1:8000/generate-captions",
        {},
        {
          headers: {
            "X-Session-Id": sessionId,
            "X-Video-Filename": videoFilename,
          },
        }
      );

      setSubtitleFilename(res.data.subtitle_file);
      setMessage("✅ Subtitles generated successfully! Ready to create final video.");
    } catch (err: any) {
      setMessage("❌ Subtitle generation failed: " + err.message);
    }finally {
      setGeneratingCaptions(false);
    }
  }

  async function handleGenerateFinalVideo(){
    const sessionId = getSessionId();

    try {
      setGeneratingFinal(true);
      setProgress(3);
        setMessage("🎥 Burning subtitles into video... Almost done!");

        const res = await axios.post(
          "http://127.0.0.1:8000/generate-captioned-video",
          {},
          {
            headers: {
              "X-Session-Id": sessionId,
              "X-Video-Filename": videoFilename,
              "X-Subtitle-Filename": subtitleFilename,
            },
          }
        );

        setFinalVideo(res.data.output_file);
        setProgress(4);
        setMessage("🎉 Final video ready! Click below to download.");
  } catch (err: any) {
    setMessage("❌ Final video generation failed: " + err.message);
  } finally {
    setGeneratingFinal(false);
  }
}

function getDownloadUrl() {
  const sessionId = getSessionId();
  return `http://127.0.0.1:8000/download?session_id=${sessionId}&filename=${finalVideo}`;
}

  const isProcessing = uploading || generatingCaptions || generatingFinal;

  const handleReset = () => {
    setSelectedFile(null);
    setVideoFilename(null);
    setSubtitleFilename(null);
    setFinalVideo(null);
    setMessage("");
    setProgress(0);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background Gradients */}
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-green-500/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-xl relative z-10">
        <div className="text-center mb-12">
          <h1 className="text-6xl font-black tracking-tighter mb-2 bg-gradient-to-r from-green-400 via-emerald-400 to-teal-400 bg-clip-text text-transparent drop-shadow-[0_0_15px_rgba(74,222,128,0.5)]">
            CAPTION.AI
          </h1>
          <p className="text-gray-400 text-lg font-light tracking-wide">
            Next-Gen Video Subtitling
          </p>
        </div>

        <div className="bg-gray-900/60 backdrop-blur-2xl border border-gray-800 rounded-3xl p-8 shadow-2xl relative overflow-hidden group">
          {/* Neon Border Glow */}
          <div className="absolute inset-0 border border-green-500/30 rounded-3xl pointer-events-none" />
          
          {/* Progress Bar */}
          <div className="absolute top-0 left-0 w-full h-1 bg-gray-800">
            <div 
              className="h-full bg-gradient-to-r from-green-400 to-emerald-500 shadow-[0_0_10px_#4ade80] transition-all duration-700 ease-out"
              style={{ width: `${(progress / 4) * 100}%` }}
            />
          </div>

          <div className="space-y-8 mt-4">
            {/* File Selection Area */}
            {!videoFilename && (
              <div className="relative group/upload">
                <input 
                  type="file" 
                  accept="video/*" 
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)} 
                  disabled={isProcessing}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20 disabled:cursor-not-allowed"
                />
                <div className={`border-2 border-dashed rounded-2xl p-10 text-center transition-all duration-300 ${
                  selectedFile 
                    ? 'border-green-500/50 bg-green-500/5' 
                    : 'border-gray-700 hover:border-green-500/30 hover:bg-gray-800/50'
                }`}>
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-800 flex items-center justify-center group-hover/upload:scale-110 transition-transform duration-300 shadow-[0_0_15px_rgba(0,0,0,0.5)]">
                    {selectedFile ? (
                      <span className="text-3xl">🎬</span>
                    ) : (
                      <svg className="w-8 h-8 text-gray-400 group-hover/upload:text-green-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                    )}
                  </div>
                  <p className={`text-lg font-medium transition-colors ${selectedFile ? 'text-green-400' : 'text-gray-300'}`}>
                    {selectedFile ? selectedFile.name : "Drop video or click to browse"}
                  </p>
                  {!selectedFile && <p className="text-sm text-gray-500 mt-2">MP4, MOV, AVI supported</p>}
                </div>
              </div>
            )}

            {/* Status Display */}
            {(videoFilename || isProcessing) && (
              <div className="bg-black/40 rounded-xl p-6 border border-gray-800 font-mono text-sm relative overflow-hidden">
                <div className="flex items-center gap-3">
                  {isProcessing ? (
                    <div className="relative">
                      <div className="w-3 h-3 bg-green-500 rounded-full animate-ping absolute opacity-75"></div>
                      <div className="w-3 h-3 bg-green-500 rounded-full relative"></div>
                    </div>
                  ) : (
                    <div className="w-3 h-3 bg-gray-600 rounded-full"></div>
                  )}
                  <span className={isProcessing ? "text-green-400 animate-pulse" : "text-gray-400"}>
                    {message || "System ready..."}
                  </span>
                </div>
              </div>
            )}

            {/* Smart Action Button */}
            <div className="pt-2">
              {!videoFilename ? (
                <button 
                  onClick={handleUpload} 
                  disabled={!selectedFile || uploading} 
                  className="w-full py-4 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 text-black font-bold text-lg shadow-[0_0_20px_rgba(74,222,128,0.3)] hover:shadow-[0_0_30px_rgba(74,222,128,0.5)] hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                  {uploading ? "UPLOADING..." : "START UPLOAD"}
                </button>
              ) : !subtitleFilename ? (
                <button 
                  onClick={handleGenerateCaptions} 
                  disabled={generatingCaptions} 
                  className="w-full py-4 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 text-black font-bold text-lg shadow-[0_0_20px_rgba(74,222,128,0.3)] hover:shadow-[0_0_30px_rgba(74,222,128,0.5)] hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 disabled:opacity-50"
                >
                  {generatingCaptions ? "GENERATING..." : "GENERATE CAPTIONS"}
                </button>
              ) : !finalVideo ? (
                <button 
                  onClick={handleGenerateFinalVideo} 
                  disabled={generatingFinal} 
                  className="w-full py-4 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 text-black font-bold text-lg shadow-[0_0_20px_rgba(74,222,128,0.3)] hover:shadow-[0_0_30px_rgba(74,222,128,0.5)] hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 disabled:opacity-50"
                >
                  {generatingFinal ? "PROCESSING..." : "RENDER VIDEO"}
                </button>
              ) : (
                <div className="flex gap-4">
                  <a 
                    href={getDownloadUrl()} 
                    download
                    className="flex-1 py-4 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 text-black font-bold text-lg text-center shadow-[0_0_20px_rgba(74,222,128,0.3)] hover:shadow-[0_0_30px_rgba(74,222,128,0.5)] hover:scale-[1.02] active:scale-[0.98] transition-all duration-300"
                  >
                    DOWNLOAD
                  </a>
                  <button 
                    onClick={handleReset}
                    className="px-6 py-4 rounded-xl border border-gray-700 text-gray-400 hover:text-white hover:border-gray-500 hover:bg-gray-800 transition-all duration-300"
                  >
                    ↺
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
        
        <div className="text-center mt-8 text-gray-600 text-xs tracking-widest uppercase">
          Powered by Faster-Whisper & FFmpeg
        </div>
      </div>
    </div>
  );
}