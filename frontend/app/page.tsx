"use client";

import { useState } from "react";
import axios from "axios";
import { getSessionId } from "../lib/session";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

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
  const [subtitles, setSubtitles] = useState<any[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [fontSize, setFontSize] = useState(24);
  const [fontColor, setFontColor] = useState("#FFFFFF");

  async function handleUpload() {
    if (!selectedFile) {
      setMessage("Please select a video file.");
      return;
    }

    const sessionId = getSessionId();
    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
      setUploading(true);
      setProgress(1);
      setMessage("Uploading video... Please wait.");

      const res = await axios.post(`${API_URL}/upload-video`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          "X-Session-Id": sessionId,
        },
      }
    );

    setVideoFilename(res.data.filename);
    setMessage("Video uploaded successfully! Ready to generate captions.");
    } catch (err: any) {
      setMessage("Upload failed: " + err.message);
    } finally {
      setUploading(false);
    }
  }

  async function handleGenerateCaptions() {
    const sessionId = getSessionId();

    try {
      setGeneratingCaptions(true);
      setProgress(2);
      setMessage("Generating captions... This may take a moment.");

      const res = await axios.post(
        `${API_URL}/generate-captions`,
        {},
        {
          headers: {
            "X-Session-Id": sessionId,
            "X-Video-Filename": videoFilename,
          },
        }
      );

      setSubtitleFilename(res.data.subtitle_file);
      setSubtitles(res.data.subtitles || []);
      setShowPreview(true);
      setMessage("Captions generated! Customize it below as you like.");
    } catch (err: any) {
      setMessage("caption generation failed: " + err.message);
    }finally {
      setGeneratingCaptions(false);
    }
  }

  async function handleGenerateFinalVideo(){
    const sessionId = getSessionId();

    try {
      setGeneratingFinal(true);
      setProgress(3);
        setMessage("🎥 Adding captions into video... Almost done!");

        const res = await axios.post(
          `${API_URL}/generate-captioned-video`,
          {},
          {
            headers: {
              "X-Session-Id": sessionId,
              "X-Video-Filename": videoFilename,
              "X-Subtitle-Filename": subtitleFilename,
              "X-Font-Size": fontSize.toString(),
              "X-Font-Color": fontColor,
            },
          }
        );

        setFinalVideo(res.data.output_file);
        setProgress(4);
        setMessage("Captioned video ready! Click below to download.");
  } catch (err: any) {
    setMessage("Captioned video generation failed: " + err.message);
  } finally {
    setGeneratingFinal(false);
  }
}

function getDownloadUrl() {
  const sessionId = getSessionId();
  return `${API_URL}/download?session_id=${sessionId}&filename=${finalVideo}`;
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
            CAPTION
          </h1>
          <p className="text-gray-400 text-lg font-light tracking-wide">
            Captioning Made Simple
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
                  {!selectedFile && <p className="text-sm text-gray-500 mt-2">ALL media files are supported</p>}
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

            {/* Caption Preview and Customization */}
            {showPreview && subtitleFilename && !finalVideo && (
              <div className="space-y-6">
                <div className="bg-black/60 rounded-2xl p-6 border border-gray-700">
                  <h3 className="text-lg font-bold text-green-400 mb-4">Caption Customization</h3>
                  
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-3">
                        Font Size: <span className="text-green-400 font-bold">{fontSize}px</span>
                      </label>
                      <input
                        type="range"
                        min="16"
                        max="48"
                        value={fontSize}
                        onChange={(e) => setFontSize(parseInt(e.target.value))}
                        className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-green-500"
                      />
                      <div className="flex justify-between text-xs text-gray-500 mt-1">
                        <span>Small</span>
                        <span>Large</span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-3">
                        Font Color
                      </label>
                      <div className="grid grid-cols-3 gap-3">
                        {[
                          { color: '#FFFFFF', name: 'White' },
                          { color: '#FFFF00', name: 'Yellow' },
                          { color: '#FF0000', name: 'Red' },
                          { color: '#00FF00', name: 'Green' },
                          { color: '#00FFFF', name: 'Cyan' },
                          { color: '#FF00FF', name: 'Magenta' }
                        ].map(({ color, name }) => (
                          <button
                            key={color}
                            onClick={() => setFontColor(color)}
                            className={`h-12 rounded-lg border-2 transition-all flex items-center justify-center ${
                              fontColor === color 
                                ? 'border-green-400 scale-105 shadow-[0_0_15px_rgba(74,222,128,0.5)]' 
                                : 'border-gray-600 hover:border-gray-400'
                            }`}
                            style={{ backgroundColor: color }}
                          >
                            <span className={`text-xs font-bold ${color === '#FFFF00' || color === '#00FFFF' || color === '#00FF00' ? 'text-black' : 'text-white'}`}>
                              {fontColor === color && '✓'}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Live Preview Sample */}
                  <div className="mt-6 bg-gray-950 rounded-xl p-4 border border-gray-800">
                    <p className="text-xs text-gray-500 mb-2">Customized:</p>
                    <p 
                      className="text-center font-bold"
                      style={{ 
                        color: fontColor, 
                        fontSize: `${fontSize * 0.8}px`,
                        textShadow: '2px 2px 4px rgba(0,0,0,0.8)'
                      }}
                    >
                      CAPTION WILL LOOK LIKE THIS ON VIDEO
                    </p>
                  </div>
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
                  {generatingFinal ? "PROCESSING..." : "DOWNLOAD VIDEO"}
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
        
        <div className="text-center mt-8 space-y-2">
          <p className="text-gray-500 text-sm">
            Made with ❤️ by <span className="text-green-400 font-semibold">Atul Kumar Jha</span>
          </p>
          <a 
            href="https://github.com/Atulkumarjha/caption" 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-gray-400 hover:text-green-400 transition-colors duration-300 text-sm"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
            </svg>
            <span>Star on GitHub</span>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
          </a>
        </div>
      </div>
    </div>
  );
}