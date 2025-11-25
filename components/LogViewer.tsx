import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, Trash2, Search, Download, Terminal, Filter, ChevronsDown } from 'lucide-react';
import { LogEntry } from '../types';

interface Props {
  logs: LogEntry[];
  onClear: () => void;
}

export const LogViewer: React.FC<Props> = ({ logs, onClear }) => {
  const [isFrozen, setIsFrozen] = useState(false); // Controls if the VIEW is updating
  const [autoScroll, setAutoScroll] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTypes, setFilterTypes] = useState({
    access: true,
    system: true,
    error: true,
  });
  
  const logsEndRef = useRef<HTMLDivElement>(null);
  
  // Local display logs (allows "freezing" the view while backend logs continue)
  const [displayedLogs, setDisplayedLogs] = useState<LogEntry[]>([]);

  // Update displayed logs when prop changes, unless frozen
  useEffect(() => {
    if (!isFrozen) {
      setDisplayedLogs(logs);
    }
  }, [logs, isFrozen]);

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
    // Format: IP - - [Date] "METHOD URL PROTO" Status Size "Referer" "UA" ...
    const parts = log.raw.split('"');
    if (parts.length >= 3) {
        // parts[0]: IP - - [Date] 
        // parts[1]: Request Line (inside quotes)
        // parts[2]: Status Size (outside quotes)
        // ... subsequent parts alternate between quoted (odd indices) and unquoted (even indices)

        return (
            <span className="font-mono">
                {/* Preamble (IP, Date) */}
                <span className="text-slate-500">{parts[0]}</span>
                
                {/* Request Line */}
                <span className="text-indigo-300 font-medium">"{parts[1]}"</span>
                
                {/* Status Code & Size (Part 2) */}
                {(() => {
                    const p2 = parts[2];
                    const statusMatch = p2.match(/(\s)(\d{3})(\s)/);
                    if (statusMatch) {
                        const status = parseInt(statusMatch[2]);
                        const color = status >= 500 ? 'text-red-500 font-bold' : status >= 400 ? 'text-orange-400' : 'text-emerald-500';
                        // Reconstruct the string with colored status
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

                {/* Remaining Parts (Referer, UA, Router, Service, Duration) */}
                {parts.slice(3).map((p, i) => {
                    const originalIndex = i + 3;
                    const isQuoted = originalIndex % 2 !== 0; // Odd indices in split array are content inside quotes

                    if (isQuoted) {
                        if (p.includes('gemini-api')) {
                             return <span key={i} className="text-emerald-400 font-bold">"{p}"</span>;
                        }
                        if (p.includes('host.docker.internal')) {
                             return <span key={i} className="text-blue-400">"{p}"</span>;
                        }
                        return <span key={i} className="text-slate-600">"{p}"</span>;
                    }
                    // Unquoted separators
                    return <span key={i} className="text-slate-600">{p}</span>;
                })}
            </span>
        );
    }

    // Fallback for unknown formats
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
            <span className="font-mono text-slate-500 hidden sm:inline">docker logs traefik | </span>
            <span className="font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 flex items-center gap-2">
                <Filter className="w-3 h-3" />
                grep gemini-api
            </span>
        </div>
        
        <div className="flex items-center gap-2 w-full md:w-auto flex-wrap justify-end">
            
            {/* Type Filters */}
            <div className="flex items-center gap-1.5 mr-2">
                <button
                    onClick={() => toggleFilter('system')}
                    className={`px-2 py-1 text-[10px] uppercase font-bold tracking-wider rounded border transition-all ${
                        filterTypes.system 
                        ? 'bg-blue-500/10 text-blue-400 border-blue-500/20 hover:bg-blue-500/20' 
                        : 'bg-slate-800 text-slate-600 border-slate-700 hover:text-slate-400'
                    }`}
                >
                    System
                </button>
                <button
                    onClick={() => toggleFilter('access')}
                    className={`px-2 py-1 text-[10px] uppercase font-bold tracking-wider rounded border transition-all ${
                        filterTypes.access
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20' 
                        : 'bg-slate-800 text-slate-600 border-slate-700 hover:text-slate-400'
                    }`}
                >
                    Access
                </button>
                <button
                    onClick={() => toggleFilter('error')}
                    className={`px-2 py-1 text-[10px] uppercase font-bold tracking-wider rounded border transition-all ${
                        filterTypes.error
                        ? 'bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500/20' 
                        : 'bg-slate-800 text-slate-600 border-slate-700 hover:text-slate-400'
                    }`}
                >
                    Error
                </button>
            </div>

            <div className="relative group flex-1 md:w-56 lg:w-64">
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
                title={autoScroll ? "Disable Auto-scroll" : "Enable Auto-scroll"}
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

            <button 
                onClick={onClear}
                className="p-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-400 hover:text-red-400 hover:bg-red-500/10 hover:border-red-500/20 transition-all"
                title="Clear Console"
            >
                <Trash2 className="w-4 h-4" />
            </button>

            <button 
                onClick={downloadLogs}
                className="p-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-400 hover:text-primary-400 hover:bg-primary-500/10 hover:border-primary-500/20 transition-all"
                title="Export Logs"
            >
                <Download className="w-4 h-4" />
            </button>
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
                    <p className="text-[10px] mt-1">Listening on gemini-api@file</p>
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
                    {isFrozen ? 'STREAM PAUSED' : 'LIVE STREAM'}
                </span>
                <span className={autoScroll ? 'text-blue-400' : 'text-slate-500'}>
                    Auto-scroll: {autoScroll ? 'ON' : 'OFF'}
                </span>
            </div>
            <div className="flex gap-4">
                <span>Filter: gemini-api</span>
                <span>Buffer: {displayedLogs.length} lines</span>
            </div>
         </div>
      </div>
    </div>
  );
};