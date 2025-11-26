import React from 'react';
import { useGalleryStore } from '../store';
import { Download, Clock, Video, Image as ImageIcon, Trash2 } from 'lucide-react';

export const Gallery: React.FC = () => {
  const { items, clearGallery, removeFromGallery } = useGalleryStore();

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center py-20 opacity-0 animate-in fade-in duration-500">
        <div className="inline-flex bg-slate-900 p-6 rounded-full mb-4 shadow-lg shadow-slate-900/50">
          <ImageIcon size={48} className="text-slate-700" />
        </div>
        <h2 className="text-xl font-bold text-white mb-2">Gallery is empty</h2>
        <p className="text-slate-500 max-w-xs mx-auto">Generated images and videos will appear here.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20">
      <div className="flex items-center justify-between sticky top-0 bg-slate-950/80 backdrop-blur-md py-4 z-10 border-b border-slate-800">
        <h2 className="text-2xl font-bold text-white">Your Creations</h2>
        <button
          onClick={() => {
            if (window.confirm('Are you sure you want to clear your entire history?')) {
              clearGallery();
            }
          }}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-500 text-sm font-medium transition-colors"
        >
          <Trash2 size={16} />
          Clear All
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {items.map((item) => (
          <div key={item.id} className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden group hover:border-indigo-500/50 transition-all duration-300 shadow-sm hover:shadow-xl">
            <div className="aspect-square bg-slate-950 relative overflow-hidden flex items-center justify-center">
              {item.type === 'video' ? (
                <video src={item.url} controls className="w-full h-full object-cover" />
              ) : (
                <img src={item.url} alt={item.prompt} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
              )}
              
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
                 <div className="flex justify-end gap-2">
                    <button
                        onClick={() => removeFromGallery(item.id)}
                        className="p-2 rounded-full bg-red-500/20 text-red-400 hover:bg-red-500 hover:text-white backdrop-blur-md transition-all"
                        title="Delete"
                    >
                        <Trash2 size={18} />
                    </button>
                    <a 
                    href={item.url} 
                    download={`lumina-${item.id}.${item.type === 'video' ? 'mp4' : 'png'}`}
                    className="p-2 rounded-full bg-white/20 text-white hover:bg-white/40 backdrop-blur-md transition-all"
                    title="Download"
                    >
                    <Download size={18} />
                    </a>
                 </div>
              </div>
            </div>
            <div className="p-4 space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-slate-950 border border-slate-800">
                   {item.type === 'video' ? <Video size={10} className="text-blue-400" /> : <ImageIcon size={10} className="text-purple-400" />}
                   <span className="truncate max-w-[80px]">{item.model.split('-')[0]}</span>
                </span>
                <span className="flex items-center gap-1">
                  <Clock size={12} />
                  {new Date(item.timestamp).toLocaleDateString()}
                </span>
              </div>
              <p className="text-sm text-slate-300 line-clamp-2 leading-relaxed" title={item.prompt}>
                {item.prompt}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};