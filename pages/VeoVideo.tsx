import React, { useState, useRef } from 'react';
import { Loader2, Video, Upload, AlertCircle, Download } from 'lucide-react';
import { generateVideo } from '../services/geminiService';
import { useGalleryStore } from '../store';

export const VeoVideo: React.FC = () => {
  const [sourceImage, setSourceImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16'>('16:9');
  const [loading, setLoading] = useState(false);
  const [resultVideoUrl, setResultVideoUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { addToGallery } = useGalleryStore();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSourceImage(file);
      setPreviewUrl(URL.createObjectURL(file));
      setResultVideoUrl(null);
    }
  };

  const handleGenerate = async () => {
    if (!sourceImage) return;
    setLoading(true);
    setResultVideoUrl(null);

    try {
      const url = await generateVideo(sourceImage, aspectRatio);
      setResultVideoUrl(url);
      addToGallery({
        id: Date.now().toString(),
        type: 'video',
        url: url,
        prompt: `Veo Animation (${aspectRatio})`,
        timestamp: Date.now(),
        model: 'veo-3.1-fast-generate-preview'
      });
    } catch (error: any) {
      console.error(error);
      const msg = error.message;
      if (msg === "ENTITY_NOT_FOUND") {
        alert("Session expired or API key not found (404).");
      } else if (msg === "QUOTA_EXCEEDED") {
        alert("Quota exceeded (429). Please check your plan.");
      } else {
        alert("Video generation failed. " + (msg || "Unknown error."));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <Video className="text-blue-500" /> Veo Animation
        </h2>
        <p className="text-slate-400">
          Upload an image to bring it to life with Veo 3.1.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-300">1. Upload Image</label>
              {!sourceImage ? (
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-700 hover:border-blue-500 hover:bg-slate-900/50 rounded-xl h-48 flex flex-col items-center justify-center cursor-pointer transition-all"
                >
                  <Upload size={32} className="text-slate-500 mb-2" />
                  <p className="text-slate-300 text-sm">Click to upload</p>
                  <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
                </div>
              ) : (
                <div className="relative rounded-xl overflow-hidden border border-slate-700 h-48 bg-slate-900 flex items-center justify-center">
                    <img src={previewUrl!} alt="Source" className="max-h-full" />
                    <button 
                    onClick={() => { setSourceImage(null); setPreviewUrl(null); }}
                    className="absolute top-2 right-2 bg-black/60 p-1 rounded-full text-white hover:bg-red-500/80"
                    >
                      <AlertCircle size={16} className="rotate-45" />
                    </button>
                </div>
              )}
          </div>

          <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-300">2. Settings</label>
              <div className="flex gap-4">
                <button 
                onClick={() => setAspectRatio('16:9')}
                className={`flex-1 py-3 px-4 rounded-lg border ${aspectRatio === '16:9' ? 'border-blue-500 bg-blue-500/10 text-blue-400' : 'border-slate-700 bg-slate-900 text-slate-400'}`}
                >
                  Landscape (16:9)
                </button>
                <button 
                onClick={() => setAspectRatio('9:16')}
                className={`flex-1 py-3 px-4 rounded-lg border ${aspectRatio === '9:16' ? 'border-blue-500 bg-blue-500/10 text-blue-400' : 'border-slate-700 bg-slate-900 text-slate-400'}`}
                >
                  Portrait (9:16)
                </button>
              </div>
          </div>

          <button
            onClick={handleGenerate}
            disabled={!sourceImage || loading}
            className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:text-slate-500 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-blue-900/20"
          >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="animate-spin" /> Generating Video...
                </span>
              ) : (
                "Generate Video"
              )}
          </button>
          
          {loading && (
              <p className="text-xs text-center text-slate-500 animate-pulse">
                This usually takes 1-2 minutes. Please don't close the tab.
              </p>
          )}
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center justify-center min-h-[400px]">
          {resultVideoUrl ? (
            <div className="w-full">
                <video 
                  src={resultVideoUrl} 
                  controls 
                  autoPlay 
                  loop 
                  className="w-full rounded-lg shadow-2xl"
                />
                <div className="mt-4 flex justify-end">
                  <a href={resultVideoUrl} download className="text-blue-400 hover:text-blue-300 text-sm flex items-center gap-1">
                    <Download size={16} /> Download MP4
                  </a>
                </div>
            </div>
          ) : (
            <div className="text-slate-600 text-center">
              <Video size={48} className="mx-auto mb-4 opacity-20" />
              <p>Video output area</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
