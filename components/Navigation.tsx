import React from 'react';
import { NavLink } from 'react-router-dom';
import { Palette, Wand2, Video, Mic, GalleryHorizontal, LayoutDashboard, MessageSquare, FileText } from 'lucide-react';

export const Navigation: React.FC = () => {
  const navItems = [
    { to: "/", icon: <LayoutDashboard size={20} />, label: "Dashboard" },
    { to: "/chat", icon: <MessageSquare size={20} />, label: "Smart Chat" },
    { to: "/transcribe", icon: <FileText size={20} />, label: "Transcribe" },
    { to: "/generate", icon: <Palette size={20} />, label: "Text to Image" },
    { to: "/edit", icon: <Wand2 size={20} />, label: "Magic Editor" },
    { to: "/video", icon: <Video size={20} />, label: "Animate (Veo)" },
    { to: "/live", icon: <Mic size={20} />, label: "Live Voice" },
    { to: "/gallery", icon: <GalleryHorizontal size={20} />, label: "Gallery" },
  ];

  return (
    <nav className="hidden md:flex flex-col w-64 bg-slate-900 border-r border-slate-800 h-screen sticky top-0">
      <div className="p-6 border-b border-slate-800">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
          Lumina
        </h1>
        <p className="text-xs text-slate-500 mt-1">AI Creative Suite</p>
      </div>
      <div className="flex-1 py-6 space-y-1 overflow-y-auto custom-scrollbar">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center px-6 py-3 text-sm font-medium transition-colors ${
                isActive
                  ? "text-indigo-400 bg-slate-800/50 border-r-2 border-indigo-400"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/30"
              }`
            }
          >
            <span className="mr-3">{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </div>
      <div className="p-6 border-t border-slate-800">
        <div className="text-xs text-slate-600">
          Powered by Gemini 2.5 & Veo 3.1
        </div>
      </div>
    </nav>
  );
};

export const MobileNav: React.FC = () => {
   const navItems = [
    { to: "/chat", icon: <MessageSquare size={20} />, label: "Chat" },
    { to: "/generate", icon: <Palette size={20} />, label: "Image" },
    { to: "/video", icon: <Video size={20} />, label: "Veo" },
    { to: "/live", icon: <Mic size={20} />, label: "Live" },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-slate-900 border-t border-slate-800 z-50 px-4 py-2 flex justify-around">
      {navItems.map((item) => (
         <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex flex-col items-center p-2 text-xs font-medium transition-colors ${
                isActive
                  ? "text-indigo-400"
                  : "text-slate-400 hover:text-slate-200"
              }`
            }
          >
            <span className="mb-1">{item.icon}</span>
            {item.label}
          </NavLink>
      ))}
    </div>
  )
}
