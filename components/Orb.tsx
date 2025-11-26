
import React from 'react';

interface OrbProps {
  isActive: boolean;
  isSpeaking: boolean;
  volume: number; // 0 to 1
}

export const Orb: React.FC<OrbProps> = ({ isActive, isSpeaking, volume }) => {
  // Calculate dynamic styles based on volume
  const scale = isActive ? 1 + volume * 0.5 : 0.8;
  const color = isSpeaking ? '#34d399' : '#6366f1'; // Emerald vs Indigo
  
  return (
    <div className="relative w-64 h-64 flex items-center justify-center perspective-1000">
      {/* Outer Glow */}
      <div 
        className={`absolute inset-0 rounded-full blur-3xl transition-all duration-300 ${isActive ? 'opacity-40' : 'opacity-10'}`}
        style={{ backgroundColor: color, transform: `scale(${scale * 1.2})` }}
      />
      
      {/* Core Sphere */}
      <div className="relative w-48 h-48 preserve-3d animate-float">
        {/* Wireframe Rings */}
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className={`absolute inset-0 rounded-full border-2 border-transparent transition-all duration-500`}
            style={{
              borderColor: isActive ? color : '#334155',
              transform: `rotateX(${i * 60}deg) rotateY(${i * 60}deg) scale(${scale})`,
              boxShadow: isActive ? `0 0 20px ${color}` : 'none',
              opacity: isActive ? 0.8 : 0.3
            }}
          />
        ))}

        {/* Inner Solid Core */}
        <div 
            className="absolute inset-8 rounded-full shadow-inner backdrop-blur-sm overflow-hidden"
            style={{
                background: `radial-gradient(circle at 30% 30%, ${isActive ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.1)'}, ${color} 60%, #000 100%)`,
                transform: `scale(${scale * 0.8})`,
                boxShadow: `inset -10px -10px 20px rgba(0,0,0,0.5), 0 0 30px ${color}`
            }}
        >
             {/* Dynamic texture inside */}
             <div className="absolute inset-0 bg-gradient-to-tr from-transparent to-white/20 opacity-30 animate-spin-slow" />
        </div>
      </div>
      
      {/* CSS for custom animations */}
      <style>{`
        .perspective-1000 { perspective: 1000px; }
        .preserve-3d { transform-style: preserve-3d; }
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        .animate-spin-slow { animation: spin-slow 8s linear infinite; }
        .animate-float { animation: float 6s ease-in-out infinite; }
      `}</style>
    </div>
  );
};
