import React from 'react';
import { AlertCircle } from 'lucide-react';

interface BillingGuardProps {
  children: React.ReactNode;
  hasKey: boolean;
  onSelectKey: () => void;
}

export const BillingGuard: React.FC<BillingGuardProps> = ({ children, hasKey, onSelectKey }) => {
  if (hasKey) return <>{children}</>;

  return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center space-y-6 animate-in fade-in zoom-in duration-300">
        <div className="bg-amber-900/30 p-4 rounded-full text-amber-500">
          <AlertCircle size={48} />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">Billing Project Required</h2>
          <p className="text-slate-400 max-w-md mx-auto">
            This feature requires a paid Google Cloud Project. Please select your project and API key to continue.
          </p>
        </div>
        <button
          onClick={onSelectKey}
          className="bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-3 px-6 rounded-lg transition-colors shadow-lg shadow-indigo-500/20"
        >
          Select API Key
        </button>
        <a 
          href="https://ai.google.dev/gemini-api/docs/billing" 
          target="_blank" 
          rel="noreferrer"
          className="text-xs text-indigo-400 hover:underline"
        >
          Read Billing Documentation
        </a>
      </div>
  );
};