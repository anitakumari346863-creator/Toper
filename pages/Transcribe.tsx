import React, { useState, useRef } from 'react';
import { Mic, Square, FileText, Loader2, Copy, Check } from 'lucide-react';
import { transcribeAudio } from '../services/geminiService';

export const Transcribe: React.FC = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcript, setTranscript] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
        handleTranscribe(audioBlob);
        
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setTranscript(null);
    } catch (err) {
      console.error("Error accessing microphone:", err);
      alert("Could not access microphone.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleTranscribe = async (audioBlob: Blob) => {
    setIsProcessing(true);
    try {
      const text = await transcribeAudio(audioBlob);
      setTranscript(text);
    } catch (error: any) {
      console.error(error);
      let errorMsg = "Transcription failed.";
      if (error.message === "QUOTA_EXCEEDED") errorMsg = "Quota exceeded (429).";
      setTranscript(`Error: ${errorMsg}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const copyToClipboard = () => {
    if (transcript) {
      navigator.clipboard.writeText(transcript);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <FileText className="text-emerald-400" /> Audio Transcription
        </h2>
        <p className="text-slate-400">
          Record your voice and let Gemini 2.5 Flash transcribe it instantly.
        </p>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 flex flex-col items-center justify-center space-y-8 min-h-[300px]">
        
        {/* Recording Controls */}
        <div className="relative">
          {isRecording && (
             <div className="absolute inset-0 bg-red-500 rounded-full animate-ping opacity-20"></div>
          )}
          <button
            onClick={isRecording ? stopRecording : startRecording}
            disabled={isProcessing}
            className={`relative w-24 h-24 rounded-full flex items-center justify-center transition-all shadow-xl ${
              isRecording 
                ? 'bg-red-600 hover:bg-red-700 text-white' 
                : 'bg-indigo-600 hover:bg-indigo-500 text-white'
            } ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {isProcessing ? (
               <Loader2 className="animate-spin" size={32} />
            ) : isRecording ? (
               <Square size={32} fill="currentColor" />
            ) : (
               <Mic size={32} />
            )}
          </button>
        </div>

        <div className="text-center">
            {isProcessing ? (
                <p className="text-indigo-400 animate-pulse font-medium">Transcribing audio...</p>
            ) : isRecording ? (
                <p className="text-red-400 font-medium animate-pulse">Recording... Click stop to finish.</p>
            ) : (
                <p className="text-slate-500">Click microphone to start recording</p>
            )}
        </div>
      </div>

      {/* Result Area */}
      {transcript && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="bg-slate-800/50 p-3 border-b border-slate-700 flex justify-between items-center">
             <h3 className="text-sm font-medium text-slate-300">Transcription Result</h3>
             <button 
               onClick={copyToClipboard}
               className="text-xs flex items-center gap-1 text-slate-400 hover:text-white transition-colors"
             >
               {copied ? <Check size={14} className="text-emerald-400"/> : <Copy size={14} />}
               {copied ? "Copied" : "Copy text"}
             </button>
          </div>
          <div className="p-6 text-slate-200 whitespace-pre-wrap leading-relaxed">
            {transcript}
          </div>
        </div>
      )}
    </div>
  );
};
