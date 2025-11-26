import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Mic, MicOff, Power, Volume2, AlertCircle } from 'lucide-react';
import { LiveSession } from "@google/genai";
import { connectLiveSession } from '../services/geminiService';
import { createPcmBlob, decode, decodeAudioData } from '../services/audioUtils';
import { Avatar } from '../components/Avatar';
import { SpaceBackground } from '../components/SpaceBackground';

export const LiveVoice: React.FC = () => {
  const [connected, setConnected] = useState(false);
  const [micActive, setMicActive] = useState(true);
  const [isAiSpeaking, setIsAiSpeaking] = useState(false);
  const [userVolume, setUserVolume] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Audio Contexts
  const inputContextRef = useRef<AudioContext | null>(null);
  const outputContextRef = useRef<AudioContext | null>(null);
  
  // Streaming Refs
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const sessionRef = useRef<LiveSession | null>(null);
  const disconnectRef = useRef<(() => void) | null>(null);
  
  // Audio Playback Queue
  const nextStartTimeRef = useRef<number>(0);
  const audioQueueRef = useRef<AudioBufferSourceNode[]>([]);
  
  // Mic Active Ref for closure access
  const micActiveRef = useRef(micActive);
  useEffect(() => { micActiveRef.current = micActive; }, [micActive]);

  const stopAudio = useCallback(() => {
    if (inputContextRef.current) {
      inputContextRef.current.close();
      inputContextRef.current = null;
    }
    if (outputContextRef.current) {
        outputContextRef.current.close();
        outputContextRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }
    
    // Stop playing audio
    audioQueueRef.current.forEach(source => {
        try { source.stop(); } catch(e) {}
    });
    audioQueueRef.current = [];
    nextStartTimeRef.current = 0;
    
    setConnected(false);
    setUserVolume(0);
    setIsAiSpeaking(false);
  }, []);

  const handleConnect = async () => {
    if (connected) {
      disconnectRef.current?.();
      stopAudio();
      return;
    }

    setError(null);
    try {
      // Initialize Audio Contexts
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      inputContextRef.current = new AudioContextClass({ sampleRate: 16000 }); // 16kHz for input
      outputContextRef.current = new AudioContextClass({ sampleRate: 24000 }); // 24kHz for output
      
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // Connect to Gemini
      const { session, disconnect } = await connectLiveSession({
        onOpen: () => {
          setConnected(true);
          console.log("Session connected");
          
          // Setup Audio Input Processing
          if (!inputContextRef.current || !streamRef.current) return;
          
          const source = inputContextRef.current.createMediaStreamSource(streamRef.current);
          const processor = inputContextRef.current.createScriptProcessor(4096, 1, 1);
          processorRef.current = processor;
          
          const analyzer = inputContextRef.current.createAnalyser();
          analyzer.fftSize = 256;
          source.connect(analyzer);
          analyzer.connect(processor);
          processor.connect(inputContextRef.current.destination);

          const dataArray = new Uint8Array(analyzer.frequencyBinCount);

          processor.onaudioprocess = (e) => {
             // 1. Calculate Volume for visual
             analyzer.getByteFrequencyData(dataArray);
             let sum = 0;
             for(let i=0; i<dataArray.length; i++) sum += dataArray[i];
             const avg = sum / dataArray.length;
             setUserVolume(avg / 255); // Normalize 0-1

             // 2. Send Audio Data
             if (!micActiveRef.current || !sessionRef.current) return;
             
             const inputData = e.inputBuffer.getChannelData(0);
             const pcmBlob = createPcmBlob(inputData);
             
             sessionRef.current.sendRealtimeInput({
                media: {
                    mimeType: pcmBlob.mimeType,
                    data: pcmBlob.data
                }
             });
          };
        },
        onMessage: async (message) => {
            // Handle Audio Output
            const base64Audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            if (base64Audio && outputContextRef.current) {
                const ctx = outputContextRef.current;
                
                // Decode
                const audioBuffer = await decodeAudioData(
                    decode(base64Audio),
                    ctx,
                    24000,
                    1
                );

                // Schedule
                const now = ctx.currentTime;
                if (nextStartTimeRef.current < now) {
                    nextStartTimeRef.current = now;
                }
                
                const source = ctx.createBufferSource();
                source.buffer = audioBuffer;
                source.connect(ctx.destination);
                source.start(nextStartTimeRef.current);
                
                source.onended = () => {
                    const index = audioQueueRef.current.indexOf(source);
                    if (index > -1) audioQueueRef.current.splice(index, 1);
                    if (audioQueueRef.current.length === 0) {
                         setIsAiSpeaking(false);
                    }
                };

                audioQueueRef.current.push(source);
                setIsAiSpeaking(true);
                nextStartTimeRef.current += audioBuffer.duration;
            }
            
            // Handle Interruption
             if (message.serverContent?.interrupted) {
                console.log("Interrupted");
                audioQueueRef.current.forEach(s => {
                    try { s.stop(); } catch(e){}
                });
                audioQueueRef.current = [];
                nextStartTimeRef.current = 0;
                setIsAiSpeaking(false);
             }
        },
        onError: (err) => {
            console.error("Session Error", err);
            setError(err.message || "Connection Error");
            stopAudio();
        },
        onClose: () => {
            console.log("Session Closed");
            stopAudio();
        }
      });
      
      sessionRef.current = session;
      disconnectRef.current = disconnect;

    } catch (err: any) {
        console.error(err);
        setError("Failed to connect: " + (err.message || "Unknown error"));
        stopAudio();
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
        disconnectRef.current?.();
        stopAudio();
    }
  }, [stopAudio]);

  return (
    <div className="relative w-full h-[600px] rounded-3xl overflow-hidden bg-slate-900 shadow-2xl border border-slate-800 flex flex-col items-center justify-center isolate">
      {/* Background */}
      <div className="absolute inset-0 z-0 opacity-80">
         <SpaceBackground />
      </div>

      {/* Error Banner */}
      {error && (
        <div className="absolute top-4 left-4 right-4 z-50 bg-red-500/90 text-white p-3 rounded-xl flex items-center gap-2 backdrop-blur-md animate-in slide-in-from-top-2">
            <AlertCircle size={20} />
            <span className="text-sm font-medium">{error}</span>
            <button onClick={() => setError(null)} className="ml-auto hover:bg-white/20 p-1 rounded">Dismiss</button>
        </div>
      )}

      {/* Avatar Layer */}
      <div className="relative z-10 w-full max-w-lg aspect-square flex items-center justify-center pointer-events-none">
         <Avatar isActive={connected} isSpeaking={isAiSpeaking} volume={userVolume} />
      </div>
      
      {/* Controls Layer */}
      <div className="absolute bottom-8 z-20 flex items-center gap-6">
         {connected && (
             <button 
                onClick={() => setMicActive(!micActive)}
                className={`p-4 rounded-full transition-all duration-300 backdrop-blur-md border ${
                    micActive ? 'bg-white/10 border-white/20 text-white hover:bg-white/20' : 'bg-red-500/20 border-red-500/50 text-red-400 hover:bg-red-500/30'
                }`}
             >
                {micActive ? <Mic size={24} /> : <MicOff size={24} />}
             </button>
         )}

         <button
            onClick={handleConnect}
            className={`flex items-center gap-3 px-8 py-4 rounded-full font-bold text-lg transition-all duration-300 shadow-lg shadow-black/50 backdrop-blur-md border ${
                connected 
                ? 'bg-red-600/90 hover:bg-red-500 text-white border-red-400' 
                : 'bg-indigo-600/90 hover:bg-indigo-500 text-white border-indigo-400'
            }`}
         >
            <Power size={24} className={connected ? "" : "animate-pulse"} />
            {connected ? "Disconnect" : "Start Live Session"}
         </button>
         
         {connected && (
             <div className="p-4 rounded-full bg-white/5 border border-white/10 text-white/50 backdrop-blur-md">
                 <Volume2 size={24} className={isAiSpeaking ? "text-cyan-400 animate-pulse" : ""} />
             </div>
         )}
      </div>

      {/* Status Indicators */}
      <div className="absolute top-6 right-6 z-20 flex flex-col items-end gap-2">
         <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full backdrop-blur-md border ${
             connected ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400' : 'bg-slate-800/50 border-slate-700 text-slate-400'
         }`}>
            <div className={`w-2 h-2 rounded-full ${connected ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`} />
            <span className="text-xs font-medium uppercase tracking-wider">{connected ? 'Live Connected' : 'Ready'}</span>
         </div>
         {connected && (
             <div className="text-xs text-slate-500 font-mono">Gemini 2.5 Flash Native</div>
         )}
      </div>
    </div>
  );
};