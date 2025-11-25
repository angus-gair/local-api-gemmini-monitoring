import React from 'react';
import { Globe, Server, Box, Zap, Lock, Cloud } from 'lucide-react';

export const ArchitectureDiagram: React.FC = () => {
  return (
    <div className="w-full bg-slate-900 rounded-xl border border-slate-800 p-8 relative overflow-hidden group">
      {/* Background Grid & Effects */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:24px_24px] opacity-20 pointer-events-none"></div>
      <div className="absolute inset-0 bg-gradient-to-r from-slate-950/50 via-transparent to-slate-950/50 pointer-events-none"></div>
      
      <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-6 lg:gap-8 max-w-6xl mx-auto py-4">
        
        {/* Client Node */}
        <div className="flex flex-col items-center gap-3 w-32 shrink-0 relative">
          <div className="absolute -inset-4 bg-indigo-500/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
          <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center relative shadow-[0_0_15px_-3px_rgba(99,102,241,0.3)] z-10">
            <Globe className="w-8 h-8 text-indigo-400" />
            <div className="absolute -right-1 -top-1 w-3 h-3 bg-green-500 rounded-full border-2 border-slate-900"></div>
          </div>
          <div className="text-center z-10">
            <h4 className="text-sm font-semibold text-slate-200">Public Client</h4>
            <p className="text-[10px] text-slate-500 font-mono">Internet</p>
          </div>
        </div>

        {/* Connection 1: HTTPS */}
        <div className="flex-1 h-px bg-slate-800 relative w-full lg:w-auto min-h-[60px] lg:min-h-0 min-w-[100px] flex items-center justify-center">
            {/* Horizontal Line (Desktop) */}
            <div className="hidden lg:block absolute inset-x-0 h-px bg-slate-700"></div>
            {/* Vertical Line (Mobile) */}
            <div className="lg:hidden absolute inset-y-0 w-px bg-slate-700"></div>
            
            {/* Animation Dot */}
            <div className="hidden lg:block absolute left-0 top-1/2 -translate-y-1/2 w-2 h-2 bg-indigo-400 rounded-full shadow-[0_0_10px_rgba(129,140,248,0.8)] animate-[moveRight_3s_linear_infinite]"></div>
            
            <div className="absolute bg-slate-900/90 px-2 py-1 border border-slate-700 rounded backdrop-blur-sm z-10 flex flex-col items-center">
                <span className="text-[10px] font-mono text-slate-300">HTTPS / 443</span>
                <span className="text-[9px] text-slate-500 mt-0.5">gemini.ajinsights.com.au</span>
            </div>
            <div className="absolute -top-4 lg:top-auto lg:bottom-4 flex items-center gap-1">
                <Lock className="w-3 h-3 text-emerald-500" />
                <span className="text-[9px] text-emerald-500 font-medium">Encrypted</span>
            </div>
        </div>

        {/* Traefik Container (Docker) */}
        <div className="relative p-5 rounded-xl border border-dashed border-slate-700 bg-slate-800/20 backdrop-blur-sm group/docker">
            <div className="absolute -top-3 left-4 bg-slate-900 px-2 text-[10px] text-slate-400 font-mono border border-slate-700 rounded flex items-center gap-1.5">
                <Box className="w-3 h-3" />
                Docker Container
            </div>
            <div className="flex flex-col items-center gap-3 w-32 shrink-0">
                <div className="w-16 h-16 rounded-2xl bg-orange-500/10 border border-orange-500/30 flex items-center justify-center shadow-[0_0_15px_-3px_rgba(249,115,22,0.3)] transition-transform group-hover/docker:scale-105">
                    <Cloud className="w-8 h-8 text-orange-400" />
                </div>
                <div className="text-center">
                    <h4 className="text-sm font-semibold text-slate-200">Traefik Proxy</h4>
                    <p className="text-[10px] text-slate-500 font-mono">SSL Termination</p>
                </div>
            </div>
        </div>

        {/* Connection 2: Direct Routing */}
        <div className="flex-1 h-px bg-slate-800 relative w-full lg:w-auto min-h-[60px] lg:min-h-0 min-w-[100px] flex items-center justify-center">
            {/* Horizontal Line (Desktop) */}
            <div className="hidden lg:block absolute inset-x-0 h-px bg-slate-700"></div>
            {/* Vertical Line (Mobile) */}
            <div className="lg:hidden absolute inset-y-0 w-px bg-slate-700"></div>

            {/* Animation Dot */}
            <div className="hidden lg:block absolute left-0 top-1/2 -translate-y-1/2 w-2 h-2 bg-blue-400 rounded-full shadow-[0_0_10px_rgba(96,165,250,0.8)] animate-[moveRight_3s_linear_infinite_1.5s]"></div>
            
            <div className="absolute bg-slate-900/90 px-2 py-1 border border-slate-700 rounded backdrop-blur-sm z-10 flex flex-col items-center">
                 <div className="flex items-center gap-1.5 mb-0.5">
                    <Zap className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                    <span className="text-[10px] font-mono text-slate-300">Direct Route</span>
                 </div>
                <span className="text-[9px] text-slate-500">host.docker.internal</span>
            </div>
        </div>

        {/* Systemd Service (Host) */}
        <div className="relative p-5 rounded-xl border border-slate-700 bg-slate-800/40 backdrop-blur-sm group/host">
            <div className="absolute -top-3 left-4 bg-slate-900 px-2 text-[10px] text-slate-400 font-mono border border-slate-700 rounded flex items-center gap-1.5">
                <Server className="w-3 h-3" />
                Host Machine
            </div>
            <div className="flex flex-col items-center gap-3 w-32 shrink-0">
                <div className="w-16 h-16 rounded-2xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center shadow-[0_0_15px_-3px_rgba(59,130,246,0.3)] transition-transform group-hover/host:scale-105">
                    <Server className="w-8 h-8 text-blue-400" />
                </div>
                <div className="text-center">
                    <h4 className="text-sm font-semibold text-slate-200">Gemini API</h4>
                    <p className="text-[10px] text-slate-500 font-mono">Port 5123</p>
                </div>
            </div>
        </div>

      </div>

      <style>{`
        @keyframes moveRight {
            0% { left: 0%; opacity: 0; }
            10% { opacity: 1; }
            90% { opacity: 1; }
            100% { left: 100%; opacity: 0; }
        }
      `}</style>
    </div>
  );
};