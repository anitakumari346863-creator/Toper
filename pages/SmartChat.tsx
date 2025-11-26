import React, { useState, useRef, useEffect } from 'react';
import { Send, Zap, Brain, User, Bot, Loader2, Code, MessageSquare, Maximize2 } from 'lucide-react';
import { generateFastResponse, generateThinkingResponse } from '../services/geminiService';
import { AppPreview } from '../components/AppPreview';

type Message = {
  id: string;
  role: 'user' | 'ai';
  text: string;
  mode?: 'fast' | 'thinking';
};

export const SmartChat: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [mode, setMode] = useState<'fast' | 'thinking'>('fast');
  const [loading, setLoading] = useState(false);
  
  // App Generation State
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'chat' | 'preview'>('chat');
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, viewMode]);

  const extractCode = (text: string) => {
    // Regex to find ```html content ```
    const match = text.match(/```html([\s\S]*?)```/);
    if (match && match[1]) {
      return match[1].trim();
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMsg: Message = { id: Date.now().toString(), role: 'user', text: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      let responseText = '';
      if (mode === 'fast') {
        responseText = await generateFastResponse(userMsg.text);
      } else {
        responseText = await generateThinkingResponse(userMsg.text);
      }

      // Check for App Code
      const code = extractCode(responseText);
      if (code) {
        setGeneratedCode(code);
        setViewMode('preview'); // Auto-switch to preview on new code
      }

      setMessages(prev => [
        ...prev, 
        { id: (Date.now() + 1).toString(), role: 'ai', text: responseText, mode }
      ]);
    } catch (error: any) {
       console.error(error);
       let errorMsg = "Failed to generate response.";
       if (error.message === "QUOTA_EXCEEDED") errorMsg = "Quota exceeded (429).";
       else if (error.message === "ENTITY_NOT_FOUND") errorMsg = "API Key error (404).";
       
       setMessages(prev => [
        ...prev, 
        { id: (Date.now() + 1).toString(), role: 'ai', text: `Error: ${errorMsg}`, mode }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto h-[calc(100vh-140px)] flex flex-col space-y-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-2 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            {mode === 'fast' ? <Zap className="text-yellow-400" /> : <Brain className="text-purple-400" />}
            Smart Chat & App Builder
          </h2>
          <p className="text-slate-400 text-sm">
             Generate text or full web apps. Try "Make a snake game".
          </p>
        </div>
        
        <div className="flex gap-4">
            {/* Model Toggle */}
            <div className="bg-slate-900 p-1 rounded-lg border border-slate-800 flex">
            <button
                onClick={() => setMode('fast')}
                className={`flex items-center px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                mode === 'fast' ? 'bg-slate-800 text-yellow-400 shadow-sm' : 'text-slate-400 hover:text-slate-200'
                }`}
            >
                <Zap size={16} className="mr-1.5" /> Fast
            </button>
            <button
                onClick={() => setMode('thinking')}
                className={`flex items-center px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                mode === 'thinking' ? 'bg-slate-800 text-purple-400 shadow-sm' : 'text-slate-400 hover:text-slate-200'
                }`}
            >
                <Brain size={16} className="mr-1.5" /> Thinking
            </button>
            </div>

            {/* View Toggle (Only if code exists) */}
            {generatedCode && (
                <div className="bg-slate-900 p-1 rounded-lg border border-slate-800 flex animate-in fade-in slide-in-from-right-4">
                    <button
                        onClick={() => setViewMode('chat')}
                        className={`flex items-center px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                        viewMode === 'chat' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                        }`}
                    >
                        <MessageSquare size={16} className="mr-1.5" /> Chat
                    </button>
                    <button
                        onClick={() => setViewMode('preview')}
                        className={`flex items-center px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                        viewMode === 'preview' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
                        }`}
                    >
                        <Code size={16} className="mr-1.5" /> Preview
                    </button>
                </div>
            )}
        </div>
      </div>

      {/* Main Content Area - Split View on Desktop if Code Exists, Tabs on Mobile */}
      <div className="flex-1 flex gap-4 overflow-hidden relative">
        
        {/* Chat Panel */}
        <div className={`flex-1 bg-slate-900/50 border border-slate-800 rounded-2xl p-4 overflow-y-auto space-y-4 custom-scrollbar transition-all duration-300 ${viewMode === 'preview' ? 'hidden md:block md:w-1/3 md:flex-none' : 'w-full'}`}>
            {messages.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-slate-500 space-y-4 p-8 text-center">
                <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center">
                    {mode === 'fast' ? <Zap size={32} className="text-yellow-500/50"/> : <Brain size={32} className="text-purple-500/50"/>}
                </div>
                <p>Ask me to generate code, write a story, or build a simple app!</p>
                <div className="flex gap-2 flex-wrap justify-center">
                    <button onClick={() => setInput("Make a calculator app")} className="text-xs bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-full border border-slate-700">Make a calculator</button>
                    <button onClick={() => setInput("Create a flappy bird game")} className="text-xs bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-full border border-slate-700">Create a game</button>
                </div>
            </div>
            )}
            
            {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`flex max-w-[90%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mx-2 ${
                    msg.role === 'user' ? 'bg-indigo-600' : 'bg-slate-700'
                }`}>
                    {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
                </div>
                <div className={`p-4 rounded-2xl ${
                    msg.role === 'user' 
                    ? 'bg-indigo-600 text-white rounded-tr-none' 
                    : 'bg-slate-800 text-slate-200 rounded-tl-none border border-slate-700'
                }`}>
                    <div className="whitespace-pre-wrap text-sm leading-relaxed font-sans">{msg.text.replace(/```html[\s\S]*?```/g, '*(App Code Generated - See Preview)*')}</div>
                    
                    {/* Metadata */}
                    <div className="flex items-center gap-2 mt-2">
                         {msg.role === 'ai' && extractCode(msg.text) && (
                            <button onClick={() => setViewMode('preview')} className="text-xs flex items-center gap-1 text-emerald-400 hover:underline">
                                <Code size={10} /> View App
                            </button>
                        )}
                        {msg.role === 'ai' && msg.mode === 'thinking' && (
                        <div className="text-xs text-purple-400 flex items-center gap-1">
                            <Brain size={10} /> Thought deeply
                        </div>
                        )}
                        {msg.role === 'ai' && msg.mode === 'fast' && (
                        <div className="text-xs text-yellow-500 flex items-center gap-1">
                            <Zap size={10} /> Fast
                        </div>
                        )}
                    </div>
                </div>
                </div>
            </div>
            ))}
            {loading && (
            <div className="flex justify-start">
                <div className="flex max-w-[80%] flex-row">
                    <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center shrink-0 mx-2">
                    <Bot size={16} />
                    </div>
                    <div className="bg-slate-800 p-4 rounded-2xl rounded-tl-none border border-slate-700 flex items-center gap-2 text-slate-400">
                    <Loader2 className="animate-spin" size={16} />
                    {mode === 'thinking' ? 'Thinking & Coding...' : 'Generating...'}
                    </div>
                </div>
            </div>
            )}
            <div ref={messagesEndRef} />
        </div>

        {/* Preview Panel (Visible if viewMode is preview OR always visible on large screens if code exists) */}
        {generatedCode && (
             <div className={`flex-1 transition-all duration-300 ${viewMode === 'chat' ? 'hidden md:block' : 'block'}`}>
                <AppPreview code={generatedCode} />
             </div>
        )}
      </div>

      {/* Input Area */}
      <form onSubmit={handleSubmit} className="relative z-10">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={`Describe the app you want to build (${mode} mode)...`}
          disabled={loading}
          className="w-full bg-slate-900 border border-slate-700 rounded-xl py-4 pl-4 pr-14 text-white placeholder-slate-500 focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:opacity-50 shadow-xl"
        />
        <button
          type="submit"
          disabled={!input.trim() || loading}
          className="absolute right-2 top-2 p-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 text-white rounded-lg transition-colors"
        >
          <Send size={20} />
        </button>
      </form>
    </div>
  );
};