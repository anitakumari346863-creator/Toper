import React from 'react';
import { Loader2 } from 'lucide-react';

interface AppPreviewProps {
  code: string | null;
}

export const AppPreview: React.FC<AppPreviewProps> = ({ code }) => {
  if (!code) {
    return (
      <div className="w-full h-full bg-slate-900 border border-slate-700 rounded-xl flex flex-col items-center justify-center text-slate-500 p-8 text-center">
        <Loader2 className="animate-spin mb-4 text-indigo-500" size={32} />
        <p>Waiting for app code...</p>
        <p className="text-xs mt-2">Ask the chat to "make an app" to see it here.</p>
      </div>
    );
  }

  return (
    <div className="w-full h-full bg-white rounded-xl overflow-hidden border border-slate-700 shadow-xl flex flex-col">
      <div className="bg-slate-100 border-b border-slate-200 px-4 py-2 flex items-center gap-2">
        <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-400"></div>
            <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
            <div className="w-3 h-3 rounded-full bg-green-400"></div>
        </div>
        <div className="text-xs text-slate-500 font-mono ml-2 flex-1 text-center">preview.html</div>
      </div>
      <iframe
        title="App Preview"
        srcDoc={code}
        className="w-full flex-1 border-0"
        sandbox="allow-scripts allow-forms allow-same-origin allow-popups allow-modals"
      />
    </div>
  );
};