import React, { useState } from 'react';
import { Loader2, Download, Save } from 'lucide-react';
import { generateImage } from '../services/geminiService';
import { useGalleryStore } from '../store';

export const TextToImage: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const { addToGallery } = useGalleryStore();

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    setLoading(true);
    setResult(null);

    try {
      const base64Image = await generateImage(prompt);
      setResult(base64Image);
      addToGallery({
        id: Date.now().toString(),
        type: 'image',
        url: base64Image,
        prompt,
        timestamp: Date.now(),
        model: 'gemini-3-pro-image-preview'
      });
    } catch (error: any) {
      console.error(error);
      if (error.message === "QUOTA_EXCEEDED") {
         alert("Quota exceeded (429). Please check your plan.");
      } else if (error.message === "ENTITY_NOT_FOUND") {
         alert("API Key invalid or project not found (404).");
      } else {
         alert("Failed to generate image. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold text-white">Text to Image</h2>
        <p className="text-slate-400">Describe what you want to see, and watch it come to life.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Controls */}
        <div className="lg:col-span-1 space-y-6">
          <form onSubmit={handleGenerate} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Prompt
              </label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="A futuristic city with flying cars at sunset, cyberpunk style..."
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white placeholder-slate-500 focus:ring-2 focus:ring-indigo-500 focus:border-transparent min-h-[120px] resize-none"
              />
            </div>
            <button
              type="submit"
              disabled={loading || !prompt}
              className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-600/50 disabled:cursor-not-allowed text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  <span>Generating...</span>
                </>
              ) : (
                <span>Generate Image</span>
              )}
            </button>
          </form>
        </div>

        {/* Preview */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-center min-h-[400px] overflow-hidden relative">
          {result ? (
            <div className="relative group w-full h-full flex items-center justify-center">
              <img src={result} alt="Generated" className="max-w-full max-h-[600px] object-contain" />
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-4">
                <a
                  href={result}
                  download={`lumina-${Date.now()}.png`}
                  className="bg-white/10 hover:bg-white/20 text-white p-3 rounded-full backdrop-blur-sm transition-colors"
                  title="Download"
                >
                  <Download size={24} />
                </a>
              </div>
            </div>
          ) : (
            <div className="text-center text-slate-500">
              {loading ? (
                <div className="flex flex-col items-center space-y-4">
                  <Loader2 className="animate-spin text-indigo-500" size={48} />
                  <p>Dreaming up your image...</p>
                </div>
              ) : (
                <div className="flex flex-col items-center space-y-2">
                  <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mb-2">
                    <Save size={24} className="opacity-50" />
                  </div>
                  <p>Generated artwork will appear here</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
