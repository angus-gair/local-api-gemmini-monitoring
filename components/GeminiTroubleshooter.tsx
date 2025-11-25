import React, { useState } from 'react';
import { GoogleGenAI } from "@google/genai";
import { LogEntry } from '../types';
import { Sparkles, Send, Loader2, AlertCircle, Terminal, RotateCcw, Lightbulb } from 'lucide-react';

interface Props {
  logs: LogEntry[];
}

const SUGGESTED_QUERIES = [
  "Analyze the recent error logs",
  "Why is the latency high?",
  "Check for SSL certificate issues",
  "Is the Gemini service healthy?",
  "Are there any 500 or 502 errors?",
  "Verify the direct routing path"
];

export const GeminiTroubleshooter: React.FC<Props> = ({ logs }) => {
  const [query, setQuery] = useState('');
  const [response, setResponse] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAsk = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!query.trim()) return;
    
    setLoading(true);
    setError(null);
    setResponse(""); // Initialize as empty string for streaming

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      // Prepare log context (last 100 lines for deeper context)
      const recentLogs = logs.slice(-100).map(l => l.raw).join('\n');
      
      const prompt = `You are an expert DevOps engineer managing a Traefik reverse proxy setup for the Gemini API.
      
      ARCHITECTURAL CONTEXT:
      - Traefik is running in a Docker container.
      - It routes traffic DIRECTLY to a systemd service ('gemini-cli-server') running on the Host machine at port 5123.
      - There are NO intermediate proxy containers.
      - Access to host is via 'host.docker.internal'.

      You have access to two distinct log sources in the stream below:
      1. Traefik Proxy Logs (routing, SSL, middleware)
      2. Systemd Service Logs (gemini-cli-server.service - application logic, usually denoted by 'gemini-cli-server')

      Analyze the following recent system logs and answer the user's question.
      If the logs show errors, suggest specific fixes taking the architecture into account.
      
      --- SYSTEM LOGS (Last 100 entries) ---
      ${recentLogs}
      --- END LOGS ---
      
      User Question: ${query}`;

      const result = await ai.models.generateContentStream({
        model: 'gemini-3-pro-preview',
        contents: prompt,
        config: {
          systemInstruction: "You are a helpful, technical assistant for a DevOps dashboard. Be concise, precise, and prioritize operational security and stability. Use Markdown for formatting.",
        }
      });

      for await (const chunk of result) {
        const text = chunk.text;
        if (text) {
          setResponse(prev => (prev || "") + text);
        }
      }
    } catch (err) {
      console.error(err);
      setError("Failed to consult Gemini. Please check your API configuration or network connection.");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setQuery('');
    setResponse(null);
    setError(null);
  };

  const selectSuggestion = (q: string) => {
    setQuery(q);
    // Optional: Auto-submit on click? 
    // For now let's just fill it so the user can edit if they want.
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden mb-8 relative shadow-xl group">
      {/* Decorative gradient background */}
      <div className="absolute top-0 right-0 p-20 bg-indigo-500/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none group-hover:bg-indigo-500/20 transition-colors duration-700"></div>
      
      <div className="p-6 relative z-10">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2.5 bg-indigo-500/20 rounded-lg border border-indigo-500/30 shadow-[0_0_15px_-3px_rgba(99,102,241,0.3)]">
            <Sparkles className="w-6 h-6 text-indigo-400" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-200">AI Troubleshooter</h3>
            <p className="text-sm text-slate-500">Intelligent log analysis using Gemini 3.0 Pro</p>
          </div>
        </div>

        <form onSubmit={handleAsk} className="relative z-20">
          <div className="flex gap-3">
            <div className="relative flex-1 group">
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Describe the issue or ask for an analysis..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-4 pr-12 py-3 text-sm text-slate-200 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20 transition-all placeholder:text-slate-600 shadow-inner"
                />
            </div>
            
            <button
              type="submit"
              disabled={loading || !query.trim()}
              className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-medium text-sm transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-900/20 active:translate-y-0.5"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              {loading ? 'Thinking...' : 'Analyze'}
            </button>
          </div>
        </form>

        {/* Suggested Queries */}
        {!response && !loading && (
          <div className="mt-4 animate-in fade-in slide-in-from-top-1">
             <div className="flex items-center gap-2 text-xs text-slate-500 mb-2">
                <Lightbulb className="w-3 h-3 text-yellow-500/70" />
                <span>Suggested Queries:</span>
             </div>
             <div className="flex flex-wrap gap-2">
                {SUGGESTED_QUERIES.map((q, i) => (
                  <button
                    key={i}
                    onClick={() => selectSuggestion(q)}
                    className="text-xs bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-indigo-400 border border-slate-800 hover:border-indigo-500/30 rounded-full px-3 py-1.5 transition-all"
                  >
                    {q}
                  </button>
                ))}
             </div>
          </div>
        )}

        {/* Status Indicators */}
        <div className="mt-6 flex flex-wrap items-center gap-4 text-xs font-mono text-slate-500 border-t border-slate-800/50 pt-4">
           <div className="flex items-center gap-2 bg-slate-950 px-2 py-1 rounded border border-slate-800">
             <Terminal className="w-3 h-3 text-slate-400" />
             <span>Context: 100 lines</span>
           </div>
           <div className="flex items-center gap-2 bg-slate-950 px-2 py-1 rounded border border-slate-800">
             <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse"></div>
             <span>Model: gemini-3-pro-preview</span>
           </div>
           {logs.some(l => l.type === 'error') && (
             <div className="flex items-center gap-2 bg-red-950/30 px-2 py-1 rounded border border-red-900/30 text-red-400">
                <AlertCircle className="w-3 h-3" />
                <span>Errors Detected in Logs</span>
             </div>
           )}
        </div>

        {error && (
          <div className="mt-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start gap-3 text-red-400 text-sm animate-in fade-in slide-in-from-top-2">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <p>{error}</p>
          </div>
        )}

        {(response !== null) && (
          <div className="mt-6 animate-in fade-in slide-in-from-top-4 duration-500">
            <div className="bg-slate-950 border border-slate-800 rounded-lg overflow-hidden shadow-lg">
               <div className="px-5 py-3 border-b border-slate-800 bg-slate-900/50 flex items-center justify-between">
                   <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-2">
                     <Sparkles className="w-3 h-3" />
                     Gemini Analysis
                   </h4>
                   <button 
                     onClick={handleReset}
                     className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-300 transition-colors px-2 py-1 hover:bg-slate-800 rounded border border-transparent hover:border-slate-700"
                     title="Reset Analysis"
                   >
                     <RotateCcw className="w-3 h-3" />
                     <span>Reset</span>
                   </button>
               </div>
               
               <div className="p-5 max-h-[500px] overflow-y-auto custom-scrollbar">
                   <div className="prose prose-invert prose-sm max-w-none text-slate-300 leading-relaxed whitespace-pre-wrap">
                     {response}
                     {loading && <span className="inline-block w-1.5 h-4 ml-0.5 bg-indigo-500 animate-pulse align-middle rounded-sm"></span>}
                   </div>
               </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};