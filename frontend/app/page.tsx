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

return (
  <div className="p-8 max-w-4xl mx-auto">
    <h1 className="text-3xl font-bold mb-6">Captioned Video Generator</h1>

    {/* Progress Indicator */}
    <div className="mb-8">
      <div className="flex justify-between mb-2">
        <span className={`text-sm font-medium ${progress >= 1 ? 'text-green-600' : 'text-gray-400'}`}>1. Upload</span>
        <span className={`text-sm font-medium ${progress >= 2 ? 'text-green-600' : 'text-gray-400'}`}>2. Generate Captions</span>
        <span className={`text-sm font-medium ${progress >= 3 ? 'text-green-600' : 'text-gray-400'}`}>3. Create Video</span>
        <span className={`text-sm font-medium ${progress >= 4 ? 'text-green-600' : 'text-gray-400'}`}>4. Download</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2.5">
        <div className="bg-green-600 h-2.5 rounded-full transition-all duration-500" style={{ width: `${(progress / 4) * 100}%` }}></div>
      </div>
    </div>

    <div className="mb-6">
      <label className="block text-sm font-medium mb-2">Select Video File</label>
      <input 
        type="file" 
        accept="video/*" 
        onChange={(e) => setSelectedFile(e.target.files?.[0] || null)} 
        disabled={isProcessing}
        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed"
      />
      {selectedFile && <p className="mt-2 text-sm text-gray-600">📁 Selected: {selectedFile.name}</p>}
    </div>

    <div className="flex flex-wrap gap-3 mb-6">
      <button 
        onClick={handleUpload} 
        disabled={!selectedFile || uploading || isProcessing} 
        className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
      >
        {uploading ? (
          <>
            <span className="inline-block animate-spin">⏳</span>
            Uploading...
          </>
        ) : (
          "1. Upload Video"
        )}
      </button>
      
      <button 
        onClick={handleGenerateCaptions} 
        disabled={!videoFilename || generatingCaptions || isProcessing} 
        className="bg-green-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
      >
        {generatingCaptions ? (
          <>
            <span className="inline-block animate-spin">⏳</span>
            Generating...
          </>
        ) : (
          "2. Generate Captions"
        )}
      </button>
      
      <button 
        onClick={handleGenerateFinalVideo} 
        disabled={!subtitleFilename || generatingFinal || isProcessing} 
        className="bg-purple-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
      >
        {generatingFinal ? (
          <>
            <span className="inline-block animate-spin">⏳</span>
            Creating...
          </>
        ) : (
          "3. Generate Final Video"
        )}
      </button>
    </div>

    {finalVideo && (
      <div className="mt-6 p-6 bg-green-50 border-2 border-green-500 rounded-lg">
        <h2 className="text-xl font-bold mb-3 text-green-800">🎉 Success!</h2>
        <a 
          href={getDownloadUrl()} 
          className="inline-block bg-black text-white px-6 py-3 rounded-lg font-medium hover:bg-gray-800 transition-colors" 
          download
        >
          📥 Download Final Video
        </a>
      </div>
    )}
    
    {message && (
      <div className={`mt-6 p-4 rounded-lg ${
        message.includes('❌') ? 'bg-red-50 border border-red-200 text-red-800' : 
        message.includes('✅') || message.includes('🎉') ? 'bg-green-50 border border-green-200 text-green-800' : 
        'bg-blue-50 border border-blue-200 text-blue-800'
      }`}>
        <p className="text-lg font-medium">{message}</p>
      </div>
    )}
  </div>
);
}