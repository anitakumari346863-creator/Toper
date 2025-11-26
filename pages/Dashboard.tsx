import React from 'react';
import { Link } from 'react-router-dom';
import { Palette, Wand2, Video, Mic, MessageSquare, FileText } from 'lucide-react';

const FeatureCard: React.FC<{
  to: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  color: string;
}> = ({ to, icon, title, description, color }) => (
  <Link
    to={to}
    className="group relative overflow-hidden bg-slate-900 border border-slate-800 rounded-2xl p-6 hover:border-slate-700 transition-all hover:shadow-xl hover:-translate-y-1"
  >
    <div className={`absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity ${color}`} />
    <div className={`w-12 h-12 rounded-lg flex items-center justify-center mb-4 ${color} bg-opacity-20 text-white`}>
      {icon}
    </div>
    <h3 className="text-lg font-bold text-white mb-2">{title}</h3>
    <p className="text-slate-400 text-sm">{description}</p>
  </Link>
);

export const Dashboard: React.FC = () => {
  return (
    <div className="max-w-5xl mx-auto space-y-12">
      <div className="text-center space-y-4">
        <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tight">
          Unleash Your <span className="text-indigo-400">Creativity</span>
        </h1>
        <p className="text-lg text-slate-400 max-w-2xl mx-auto">
          Create, edit, animate, and converse with the power of Google's latest Gemini 2.5 and Veo models.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <FeatureCard
          to="/chat"
          icon={<MessageSquare size={24} />}
          title="Smart Chat"
          description="Switch between Fast Mode (Flash Lite) and Thinking Mode (Pro) for complex reasoning."
          color="bg-orange-600"
        />
        <FeatureCard
          to="/transcribe"
          icon={<FileText size={24} />}
          title="Audio Transcription"
          description="Accurately transcribe spoken words into text using Gemini 2.5 Flash."
          color="bg-emerald-500"
        />
        <FeatureCard
          to="/live"
          icon={<Mic size={24} />}
          title="Live Voice"
          description="Have real-time, low-latency voice conversations with Gemini Native Audio."
          color="bg-teal-600"
        />
        <FeatureCard
          to="/generate"
          icon={<Palette size={24} />}
          title="Text to Image"
          description="Generate stunning high-quality visuals from simple text descriptions."
          color="bg-purple-600"
        />
        <FeatureCard
          to="/edit"
          icon={<Wand2 size={24} />}
          title="Magic Editor"
          description="Modify existing images with natural language commands."
          color="bg-pink-600"
        />
        <FeatureCard
          to="/video"
          icon={<Video size={24} />}
          title="Veo Animation"
          description="Transform static images into cinematic videos with Veo 3.1."
          color="bg-blue-600"
        />
      </div>
    </div>
  );
};
