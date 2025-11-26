import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, Trash2, Search, Download, Terminal, Filter, ChevronsDown, Laptop } from 'lucide-react';
import { LogEntry } from '../types';
import { invoke } from '@tauri-apps/api/core';

interface Props {
  logs: LogEntry[];
  onClear: () => void;
}

// Helper to detect if we are running in Tauri
const isTauri = () => typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;

export const LogViewer: React.FC<Props> = ({ logs: propLogs, onClear }) => {
  const [isFrozen, setIsFrozen] = useState(false);
  const [autoScroll, setAutoScroll] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTypes, setFilterTypes] = useState({
    access: true,
    system: true,
    error: true,
  });
  
  // State for Real Logs (Tauri Mode)
  const [realLogs, setRealLogs] = useState<LogEntry[]>([]);
  const [isNative, setIsNative] = useState(false);

  const logsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsNative(isTauri());
  }, []);

  // Poll for Real Logs if in Tauri mode
  useEffect(() => {
    if (!isNative) return;

    const fetchRealLogs = async () => {
        if (isFrozen) return;
        try {
            const output = await invoke<string>('get_docker_logs');
            const lines = output.split('\n').filter(Boolean);
            
            // Filter specifically for Gemini-related entries to match the requested feature
            const geminiLines = lines.filter(line => 
                line.includes('gemini') || 
                line.includes('Gemini') || 
                line.includes(':5123')
            );

            const parsedLogs: LogEntry[] = geminiLines.map((raw, idx) => {
                let type: LogEntry['type'] = 'system';
                if (raw.includes('GET') || raw.includes('POST') || raw.includes('OPTIONS')) type = 'access';
                if (raw.includes('ERROR') || raw.includes('level=error') || raw.includes('level=fatal')) type = 'error';
                
                return {
                    id: `real-${idx}`,
                    timestamp: new Date(), // In a real app we'd parse the timestamp from the log line
                    raw: raw,
                    type: type
                };
            });
            setRealLogs(parsedLogs);
        } catch (err) {
            console.error("Failed to fetch docker logs:", err);
        }
    };

    const interval = setInterval(fetchRealLogs, 2000); // Poll every 2s
    fetchRealLogs(); // Initial fetch
    return () => clearInterval(interval);
  }, [isNative, isFrozen]);
  
  // Decide source of truth: Props (Simulation) or Local State (Real)
  const sourceLogs = isNative ? realLogs : propLogs;
  const displayedLogs = sourceLogs; 

  // Auto-scroll logic
  useEffect(() => {
    if (autoScroll && !isFrozen && logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [displayedLogs, autoScroll, isFrozen]);

  const filteredLogs = displayedLogs.filter(log => 
    filterTypes[log.type] &&
    log.raw.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleFilter = (type: keyof typeof filterTypes) => {
    setFilterTypes(prev => ({ ...prev, [type]: !prev[type] }));
  };

  const downloadLogs = () => {
    const content = displayedLogs.map(l => l.raw).join('\n');
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `gemini-traefik-logs-${new Date().toISOString()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const renderLogLine = (log: LogEntry) => {
    // 1. Handle Systemd Service Logs (gemini-cli-server)
    if (log.raw.includes('gemini-cli-server')) {
         const isError = log.type === 'error' || log.raw.includes('ERROR');
         return (
             <span className={`font-mono ${isError ? 'text-red-400' : 'text-yellow-300'}`}>
                {log.raw}
             </span>
         );
    }

    // 2. Handle Structured Traefik Logs (key=value)
    if (log.raw.includes('level=') || log.raw.includes('time=')) {
        return (
            <span className="font-mono">
                {log.raw.split(' ').map((part, i) => {
                    const eqIndex = part.indexOf('=');
                    if (eqIndex !== -1) {
                         const key = part.substring(0, eqIndex);
                         const value = part.substring(eqIndex + 1);
                         
                         let valueClass = 'text-slate-300';
                         if (key === 'level') {
                             if (value.includes('error') || value.includes('fatal')) valueClass = 'text-red-500 font-bold';
                             else if (value.includes('warn')) valueClass = 'text-yellow-400';
                             else valueClass = 'text-blue-400';
                         } else if (key === 'msg') {
                             valueClass = 'text-slate-100 font-medium';
                         } else if (key === 'time') {
                             valueClass = 'text-slate-600';
                         } else if (key === 'router') {
                             valueClass = 'text-emerald-400 font-bold';
                         }
                         
                         return (
                            <span key={i} className="mr-2 inline-block">
                                <span className="text-slate-500">{key}=</span>
                                <span className={valueClass}>{value}</span>
                            </span>
                         )
                    }
                    return <span key={i} className="mr-2 text-slate-400 inline-block">{part}</span>
                })}
            </span>
        )
    }

    // 3. Handle Standard Access Logs (CLF-like with extended fields)
    const parts = log.raw.split('"');
    if (parts.length >= 3) {
        return (
            <span className="font-mono">
                <span className="text-slate-500">{parts[0]}</span>
                <span className="text-indigo-300 font-medium">"{parts[1]}"</span>
                {(() => {
                    const p2 = parts[2];
                    const statusMatch = p2.match(/(\s)(\d{3})(\s)/);
                    if (statusMatch) {
                        const status = parseInt(statusMatch[2]);
                        const color = status >= 500 ? 'text-red-500 font-bold' : status >= 400 ? 'text-orange-400' : 'text-emerald-500';
                        const [before, code, after] = [
                            p2.substring(0, statusMatch.index),
                            statusMatch[0],
                            p2.substring(statusMatch.index! + statusMatch[0].length)
                        ];
                        return (
                            <span>
                                <span className="text-slate-500">{before}</span>
                                <span className={color}>{code}</span>
                                <span className="text-slate-500">{after}</span>
                            </span>
                        );
                    }
                    return <span className="text-slate-500">{p2}</span>;
                })()}

                {parts.slice(3).map((p, i) => {
                    const originalIndex = i + 3;
                    const isQuoted = originalIndex % 2 !== 0; 

                    if (isQuoted) {
                        if (p.includes('gemini-api')) return <span key={i} className="text-emerald-400 font-bold">"{p}"</span>;
                        if (p.includes('host.docker.internal')) return <span key={i} className="text-blue-400">"{p}"</span>;
                        return <span key={i} className="text-slate-600">"{p}"</span>;
                    }
                    return <span key={i} className="text-slate-600">{p}</span>;
                })}
            </span>
        );
    }

    return <span className="text-slate-300 font-mono">{log.raw}</span>;
  };

  return (
    <div className="h-[calc(100vh-12rem)] flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Toolbar */}
      <div className="bg-slate-900 border border-slate-800 border-b-0 rounded-t-xl p-3 flex flex-col md:flex-row gap-3 justify-between items-center">
        <div className="flex items-center gap-2 text-slate-400 text-sm">
            <div className="p-1.5 bg-slate-800 rounded">
                <Terminal className="w-4 h-4 text-slate-300" />
            </div>
            
            {isNative ? (
                <div className="flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded text-blue-400 text-xs font-bold">
                    <Laptop className="w-3 h-3" />
                    NATIVE MODE
                </div>
            ) : (
                <div className="flex items-center gap-2 bg-slate-800 border border-slate-700 px-2 py-0.5 rounded text-slate-500 text-xs font-bold">
                    SIMULATION MODE
                </div>
            )}
            
            <span className="font-mono text-slate-500 hidden sm:inline">|</span>
            <span className="font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 flex items-center gap-2">
                <Filter className="w-3 h-3" />
                grep gemini-api
            </span>
        </div>
        
        <div className="flex items-center gap-2 w-full md:w-auto flex-wrap justify-end">
            <div className="flex items-center gap-1.5 mr-2">
                {['system', 'access', 'error'].map(type => (
                    <button
                        key={type}
                        onClick={() => toggleFilter(type as any)}
                        className={`px-2 py-1 text-[10px] uppercase font-bold tracking-wider rounded border transition-all ${
                            filterTypes[type as keyof typeof filterTypes] 
                            ? (type === 'error' ? 'bg-red-500/10 text-red-400 border-red-500/20' : type === 'access' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-blue-500/10 text-blue-400 border-blue-500/20')
                            : 'bg-slate-800 text-slate-600 border-slate-700 hover:text-slate-400'
                        }`}
                    >
                        {type}
                    </button>
                ))}
            </div>

            <div className="relative group flex-1 md:w-48 lg:w-56">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-primary-400 transition-colors" />
                <input 
                    type="text" 
                    placeholder="Search logs..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-sm text-slate-200 focus:outline-none focus:border-primary-500/50 transition-all placeholder:text-slate-600"
                />
            </div>

            <div className="h-6 w-px bg-slate-800 mx-1 hidden md:block"></div>

            <button 
                onClick={() => setAutoScroll(!autoScroll)}
                className={`p-2 rounded-lg border transition-all ${autoScroll ? 'bg-primary-500/10 text-primary-400 border-primary-500/20' : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'}`}
                title="Auto-scroll"
            >
                <ChevronsDown className="w-4 h-4" />
            </button>

            <button 
                onClick={() => setIsFrozen(!isFrozen)}
                className={`p-2 rounded-lg border transition-all ${isFrozen ? 'bg-orange-500/10 text-orange-400 border-orange-500/20 hover:bg-orange-500/20' : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'}`}
                title={isFrozen ? "Resume View" : "Pause View"}
            >
                {isFrozen ? <Play className="w-4 h-4 fill-current" /> : <Pause className="w-4 h-4 fill-current" />}
            </button>
            
            {!isNative && (
                <button 
                    onClick={onClear}
                    className="p-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-400 hover:text-red-400 hover:bg-red-500/10 hover:border-red-500/20 transition-all"
                    title="Clear Console"
                >
                    <Trash2 className="w-4 h-4" />
                </button>
            )}
        </div>
      </div>

      {/* Console Area */}
      <div className="flex-1 bg-slate-950 border border-slate-800 rounded-b-xl overflow-hidden flex flex-col relative group">
         <div className="absolute top-0 left-0 right-0 h-8 bg-gradient-to-b from-slate-950 to-transparent pointer-events-none z-10"></div>
         
         <div className="flex-1 overflow-y-auto p-4 font-mono text-xs space-y-0.5 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
            {filteredLogs.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-600 opacity-50">
                    <Filter className="w-12 h-12 mb-4 opacity-20" />
                    <p className="font-medium">Waiting for logs...</p>
                    {isNative ? (
                        <p className="text-[10px] mt-1 text-blue-400">Polling local Docker daemon...</p>
                    ) : (
                        <p className="text-[10px] mt-1">Simulated Stream (Web Mode)</p>
                    )}
                </div>
            ) : (
                filteredLogs.map((log) => (
                    <div key={log.id} className="break-all hover:bg-white/5 px-2 py-0.5 rounded transition-colors border-l-2 border-transparent hover:border-slate-700">
                        {renderLogLine(log)}
                    </div>
                ))
            )}
            <div ref={logsEndRef} />
         </div>

         {/* Status Bar */}
         <div className="bg-slate-900 border-t border-slate-800 px-3 py-1.5 text-[10px] text-slate-500 flex justify-between font-mono items-center">
            <div className="flex gap-4">
                <span className={`flex items-center gap-1.5 ${isFrozen ? 'text-orange-400' : 'text-emerald-400'}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${isFrozen ? 'bg-orange-500' : 'bg-emerald-500 animate-pulse'}`}></span>
                    {isFrozen ? 'STREAM PAUSED' : (isNative ? 'LIVE DOCKER STREAM' : 'SIMULATED STREAM')}
                </span>
            </div>
            <div className="flex gap-4">
                <span>Source: {isNative ? 'Local Docker' : 'Browser Mock'}</span>
                <span>Buffer: {displayedLogs.length} lines</span>
            </div>
         </div>
      </div>
    </div>
  );
};
