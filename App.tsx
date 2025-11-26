import React from 'react';
import { LiveVoice } from './pages/LiveVoice';

const Layout: React.FC = () => {
  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100 font-sans items-center justify-center p-4">
      <main className="w-full max-w-4xl">
        <LiveVoice />
      </main>
    </div>
  );
};

export default function App() {
  return (
    <Layout />
  );
}