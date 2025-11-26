import React, { useState, useRef } from 'react';
import { Loader2, Upload, Wand2, Download, X } from 'lucide-react';
import { editImage } from '../services/geminiService';
import { useGalleryStore } from '../store';

export const ImageEditor: React.FC = () => {
  const [sourceImage, setSourceImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { addToGallery } = useGalleryStore();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSourceImage(file);
      setPreviewUrl(URL.createObjectURL(file));
      setResult(null);
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sourceImage || !prompt.trim()) return;

    setLoading(true);
    setResult(null);

    try {
      // Using gemini-2.5-flash-image
      const base64Image = await editImage(sourceImage, prompt);
      setResult(base64Image);
      addToGallery({
        id: Date.now().toString(),
        type: 'image',
        url: base64Image,
        prompt: `Edit: ${prompt}`,
        timestamp: Date.now(),
        model: 'gemini-2.5-flash-image'
      });
    } catch (error: any) {
      console.error(error);
      if (error.message === "QUOTA_EXCEEDED") {
         alert("Quota exceeded (429). Please check your plan.");
      } else if (error.message === "ENTITY_NOT_FOUND") {
         alert("API Key invalid or project not found (404).");
      } else {
         alert("Failed to edit image. " + (error.message || ""));
      }
    } finally {
      setLoading(false);
    }
  };

  const clearImage = () => {
    setSourceImage(null);
    setPreviewUrl(null);
    setResult(null);
    setPrompt('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <Wand2 className="text-pink-500" /> Magic Editor
        </h2>
        <p className="text-slate-400">
          Upload an image and use natural language to modify it. Try "Add a retro filter" or "Remove the background".
        </p>
      </div>

      {!sourceImage ? (
        <div 
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-slate-700 hover:border-indigo-500 hover:bg-slate-900/50 rounded-2xl h-64 flex flex-col items-center justify-center cursor-pointer transition-all"
        >
          <Upload size={48} className="text-slate-500 mb-4" />
          <p className="text-slate-300 font-medium">Click to upload an image</p>
          <p className="text-slate-500 text-sm mt-2">JPG, PNG up to 5MB</p>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            className="hidden" 
            accept="image/png, image/jpeg, image/jpg"
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Source */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-medium text-slate-400">Original</h3>
              <button onClick={clearImage} className="text-xs text-red-400 hover:text-red-300 flex items-center">
                <X size={14} className="mr-1" /> Remove
              </button>
            </div>
            <div className="relative bg-slate-900 rounded-xl overflow-hidden aspect-square flex items-center justify-center border border-slate-800">
                {previewUrl && <img src={previewUrl} alt="Original" className="max-w-full max-h-full object-contain" />}
            </div>
            
            <form onSubmit={handleEdit} className="space-y-4">
              <input
                type="text"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="E.g., Make it look like a sketch"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white placeholder-slate-500 focus:ring-2 focus:ring-pink-500"
              />
              <button
                type="submit"
                disabled={loading || !prompt}
                className="w-full bg-pink-600 hover:bg-pink-500 disabled:bg-pink-600/50 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center"
              >
                {loading ? <Loader2 className="animate-spin" /> : "Apply Edit"}
              </button>
            </form>
          </div>

          {/* Result */}
          <div className="space-y-4">
              <h3 className="text-sm font-medium text-slate-400">Result</h3>
              <div className="relative bg-slate-900 rounded-xl overflow-hidden aspect-square flex items-center justify-center border border-slate-800">
                {loading ? (
                  <Loader2 className="animate-spin text-pink-500" size={48} />
                ) : result ? (
                  <div className="relative group w-full h-full flex items-center justify-center">
                    <img src={result} alt="Edited" className="max-w-full max-h-full object-contain" />
                    <a 
                      href={result}
                      download={`edited-${Date.now()}.png`}
                      className="absolute bottom-4 right-4 bg-black/70 p-2 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Download size={20} />
                    </a>
                  </div>
                ) : (
                  <p className="text-slate-600 text-sm">Edited image will appear here</p>
                )}
              </div>
          </div>
        </div>
      )}
    </div>
  );
};
