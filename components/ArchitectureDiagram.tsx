import React, { useState, useEffect } from 'react';
import { Globe, Server, Box, Zap, Lock, Cloud, Info, X, PlayCircle, CheckCircle2, FileJson, Shield } from 'lucide-react';

type NodeType = 'client' | 'traefik' | 'host';

const NODE_DETAILS = {
  client: {
    title: "Public Client",
    description: "External entry point via Public Internet",
    specs: [
      { label: "DNS", value: "gemini.ajinsights.com.au" },
      { label: "Record Type", value: "A Record" },
      { label: "Public IP", value: "180.181.228.230" },
      { label: "Protocol", value: "HTTPS (TLS 1.3)" }
    ]
  },
  traefik: {
    title: "Traefik Proxy (Docker)",
    description: "Reverse proxy handling SSL and routing",
    specs: [
      { label: "Container Name", value: "traefik" },
      { label: "Network", value: "traefik-public" },
      { label: "SSL Resolver", value: "letsencrypt (ACME)" },
      { label: "Router Rule", value: "Host(`gemini...`)" },
      { label: "Config Type", value: "Dynamic (File)" }
    ]
  },
  host: {
    title: "Host Service (Systemd)",
    description: "Node.js application running natively on host",
    specs: [
      { label: "Service", value: "gemini-cli-server.service" },
      { label: "Local Address", value: "127.0.0.1" },
      { label: "Port", value: "5123" },
      { label: "Path", value: "/home/ghost/local-api-gemini/" },
      { label: "Access", value: "host.docker.internal" }
    ]
  }
};

const STEPS = [
    { id: 0, text: "System Idle", sub: "Ready for traffic" },
    { id: 1, text: "Sending Request", sub: "Client → Traefik (HTTPS/443)" },
    { id: 2, text: "Routing Traffic", sub: "Traefik → Host (HTTP/5123)" },
    { id: 3, text: "Processing", sub: "Systemd Service executing logic" },
    { id: 4, text: "Sending Response", sub: "Host → Traefik" },
    { id: 5, text: "Returning Data", sub: "Traefik → Client" }
];

export const ArchitectureDiagram: React.FC = () => {
  const [selectedNode, setSelectedNode] = useState<NodeType | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationStep, setSimulationStep] = useState(0); 

  const handleSimulate = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isSimulating) return;
    
    setIsSimulating(true);
    setSimulationStep(1); // Client -> Traefik

    // Orchestrate the animation sequence
    setTimeout(() => setSimulationStep(2), 1000); // Traefik -> Host
    setTimeout(() => setSimulationStep(3), 2000); // Processing
    setTimeout(() => setSimulationStep(4), 3500); // Host -> Traefik
    setTimeout(() => setSimulationStep(5), 4500); // Traefik -> Client
    setTimeout(() => {
        setSimulationStep(0);
        setIsSimulating(false);
    }, 5500);
  };

  const currentStatus = STEPS.find(s => s.id === simulationStep) || STEPS[0];

  return (
    <div className="w-full bg-slate-900 rounded-xl border border-slate-800 p-1 relative overflow-hidden group select-none transition-all duration-500 hover:border-slate-700">
      {/* Container with internal padding */}
      <div className="p-4 md:p-8 relative z-10" onClick={() => setSelectedNode(null)}>
        
        {/* Header / Controls */}
        <div className="absolute top-4 right-4 flex gap-2 z-20">
            {isSimulating && (
                <div className="flex flex-col items-end mr-4 animate-in fade-in slide-in-from-right-4">
                    <span className="text-xs font-bold text-indigo-400">{currentStatus.text}</span>
                    <span className="text-[10px] text-slate-500 font-mono">{currentStatus.sub}</span>
                </div>
            )}
            <button 
                onClick={handleSimulate}
                disabled={isSimulating}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                    isSimulating 
                    ? 'bg-slate-800 text-slate-500 cursor-default ring-1 ring-indigo-500/20' 
                    : 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 hover:bg-indigo-500/20 shadow-lg shadow-indigo-900/20'
                }`}
            >
                {isSimulating ? <CheckCircle2 className="w-3.5 h-3.5 animate-pulse" /> : <PlayCircle className="w-3.5 h-3.5" />}
                {isSimulating ? 'Tracing...' : 'Trace Request'}
            </button>
        </div>

        {/* Background Grid */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:24px_24px] opacity-20 pointer-events-none"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/80 via-transparent to-slate-950/80 pointer-events-none"></div>

        {/* Diagram Nodes */}
        <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-6 lg:gap-8 max-w-6xl mx-auto py-8">
            
            {/* Client Node */}
            <div 
                onClick={(e) => { e.stopPropagation(); setSelectedNode('client'); }}
                className={`flex flex-col items-center gap-3 w-32 shrink-0 relative cursor-pointer transition-all duration-300 hover:scale-105 ${selectedNode === 'client' ? 'scale-105' : ''}`}
            >
                <div className={`absolute -inset-4 bg-indigo-500/20 blur-xl rounded-full transition-opacity duration-300 ${selectedNode === 'client' || simulationStep === 1 || simulationStep === 5 ? 'opacity-100' : 'opacity-0'}`}></div>
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center relative shadow-lg z-10 transition-all duration-300 ${
                    selectedNode === 'client' 
                    ? 'bg-indigo-500/20 border-2 border-indigo-500 shadow-indigo-500/20' 
                    : 'bg-indigo-500/10 border border-indigo-500/30 shadow-[0_0_15px_-3px_rgba(99,102,241,0.3)]'
                }`}>
                    <Globe className={`w-8 h-8 ${selectedNode === 'client' ? 'text-indigo-300' : 'text-indigo-400'}`} />
                    <div className="absolute -right-1 -top-1 w-3 h-3 bg-green-500 rounded-full border-2 border-slate-900"></div>
                </div>
                <div className="text-center z-10">
                    <h4 className={`text-sm font-semibold transition-colors ${selectedNode === 'client' ? 'text-indigo-300' : 'text-slate-200'}`}>Public Client</h4>
                    <p className="text-[10px] text-slate-500 font-mono">Internet</p>
                </div>
            </div>

            {/* Connection 1: HTTPS */}
            <div className="flex-1 h-px bg-slate-800 relative w-full lg:w-auto min-h-[60px] lg:min-h-0 min-w-[100px] flex items-center justify-center group/conn1">
                <div className="hidden lg:block absolute inset-x-0 h-px bg-slate-700 group-hover/conn1:bg-slate-600 transition-colors"></div>
                <div className="lg:hidden absolute inset-y-0 w-px bg-slate-700"></div>
                
                {/* Passive Animation */}
                {!isSimulating && (
                    <div className="hidden lg:block absolute left-0 top-1/2 -translate-y-1/2 w-2 h-2 bg-indigo-400/50 rounded-full shadow-[0_0_10px_rgba(129,140,248,0.8)] animate-[moveRight_3s_linear_infinite]"></div>
                )}

                {/* Simulation Packet (Request) */}
                {simulationStep === 1 && (
                     <div className="hidden lg:block absolute left-0 top-1/2 -translate-y-1/2 z-20 animate-[moveRight_1s_linear_forwards]">
                        <div className="bg-white text-slate-900 p-1 rounded shadow-[0_0_15px_rgba(255,255,255,0.8)] flex items-center gap-1 scale-75">
                            <FileJson className="w-3 h-3" />
                        </div>
                     </div>
                )}
                {/* Simulation Packet (Response) */}
                {simulationStep === 5 && (
                     <div className="hidden lg:block absolute right-0 top-1/2 -translate-y-1/2 z-20 animate-[moveLeft_1s_linear_forwards]">
                        <div className="bg-emerald-400 text-emerald-950 p-1 rounded shadow-[0_0_15px_rgba(52,211,153,0.8)] flex items-center gap-1 scale-75">
                            <FileJson className="w-3 h-3" />
                        </div>
                     </div>
                )}
                
                <div className="absolute bg-slate-900/90 px-2 py-1 border border-slate-700 rounded backdrop-blur-sm z-10 flex flex-col items-center hover:border-indigo-500/50 transition-colors cursor-help group/badge">
                    <span className="text-[10px] font-mono text-slate-300 group-hover/badge:text-indigo-300">HTTPS / 443</span>
                </div>
                <div className="absolute -top-6 lg:top-auto lg:bottom-4 flex items-center gap-1">
                    <Lock className="w-3 h-3 text-emerald-500" />
                    <span className="text-[9px] text-emerald-500 font-medium">Encrypted</span>
                </div>
            </div>

            {/* Traefik Node */}
            <div 
                onClick={(e) => { e.stopPropagation(); setSelectedNode('traefik'); }}
                className={`relative p-5 rounded-xl border border-dashed transition-all duration-300 cursor-pointer group/docker ${
                    selectedNode === 'traefik' 
                    ? 'border-orange-500 bg-orange-500/10 scale-105' 
                    : 'border-slate-700 bg-slate-800/20 hover:border-orange-500/50 hover:bg-slate-800/40'
                }`}
            >
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-slate-900 px-2 text-[10px] text-slate-400 font-mono border border-slate-700 rounded flex items-center gap-1.5 whitespace-nowrap shadow-sm">
                    <Box className="w-3 h-3" />
                    Docker Container
                </div>
                
                {/* Active Indicator Ring */}
                { (simulationStep === 1 || simulationStep === 2 || simulationStep === 4 || simulationStep === 5) && (
                    <div className="absolute inset-0 border-2 border-orange-500/30 rounded-xl animate-pulse"></div>
                )}

                <div className="flex flex-col items-center gap-3 w-32 shrink-0">
                    <div className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-300 relative ${
                        selectedNode === 'traefik'
                        ? 'bg-orange-500/20 border-2 border-orange-500 shadow-orange-500/20'
                        : 'bg-orange-500/10 border border-orange-500/30 shadow-[0_0_15px_-3px_rgba(249,115,22,0.3)]'
                    }`}>
                         {/* Internal routing animation */}
                         {(simulationStep === 1 || simulationStep === 4) && (
                            <div className="absolute inset-0 bg-orange-500/10 rounded-xl animate-ping"></div>
                         )}
                        <Cloud className={`w-8 h-8 ${selectedNode === 'traefik' ? 'text-orange-300' : 'text-orange-400'}`} />
                    </div>
                    <div className="text-center">
                        <h4 className={`text-sm font-semibold transition-colors ${selectedNode === 'traefik' ? 'text-orange-300' : 'text-slate-200'}`}>Traefik Proxy</h4>
                        <p className="text-[10px] text-slate-500 font-mono">SSL Termination</p>
                    </div>
                </div>
            </div>

            {/* Connection 2: Direct */}
            <div className="flex-1 h-px bg-slate-800 relative w-full lg:w-auto min-h-[60px] lg:min-h-0 min-w-[100px] flex items-center justify-center group/conn2">
                <div className="hidden lg:block absolute inset-x-0 h-px bg-slate-700 group-hover/conn2:bg-slate-600 transition-colors"></div>
                <div className="lg:hidden absolute inset-y-0 w-px bg-slate-700"></div>

                {!isSimulating && (
                    <div className="hidden lg:block absolute left-0 top-1/2 -translate-y-1/2 w-2 h-2 bg-blue-400/50 rounded-full shadow-[0_0_10px_rgba(96,165,250,0.8)] animate-[moveRight_3s_linear_infinite_1.5s]"></div>
                )}
                
                {/* Simulation Packet (Request) */}
                {simulationStep === 2 && (
                     <div className="hidden lg:block absolute left-0 top-1/2 -translate-y-1/2 z-20 animate-[moveRight_1s_linear_forwards]">
                        <div className="bg-white text-slate-900 p-1 rounded shadow-[0_0_15px_rgba(255,255,255,0.8)] flex items-center gap-1 scale-75">
                            <FileJson className="w-3 h-3" />
                        </div>
                     </div>
                )}
                {/* Simulation Packet (Response) */}
                {simulationStep === 4 && (
                     <div className="hidden lg:block absolute right-0 top-1/2 -translate-y-1/2 z-20 animate-[moveLeft_1s_linear_forwards]">
                        <div className="bg-emerald-400 text-emerald-950 p-1 rounded shadow-[0_0_15px_rgba(52,211,153,0.8)] flex items-center gap-1 scale-75">
                            <FileJson className="w-3 h-3" />
                        </div>
                     </div>
                )}

                <div className="absolute bg-slate-900/90 px-2 py-1 border border-slate-700 rounded backdrop-blur-sm z-10 flex flex-col items-center hover:border-blue-500/50 transition-colors cursor-help group/badge">
                     <div className="flex items-center gap-1.5 mb-0.5">
                        <Zap className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                        <span className="text-[10px] font-mono text-slate-300 group-hover/badge:text-blue-300">Direct</span>
                     </div>
                    <span className="text-[9px] text-slate-500">host.docker.internal</span>
                </div>
            </div>

            {/* Host Node */}
            <div 
                onClick={(e) => { e.stopPropagation(); setSelectedNode('host'); }}
                className={`relative p-5 rounded-xl border transition-all duration-300 cursor-pointer group/host ${
                    selectedNode === 'host'
                    ? 'border-blue-500 bg-blue-500/10 scale-105'
                    : 'border-slate-700 bg-slate-800/40 hover:border-blue-500/50 hover:bg-slate-800/60'
                }`}
            >
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-slate-900 px-2 text-[10px] text-slate-400 font-mono border border-slate-700 rounded flex items-center gap-1.5 whitespace-nowrap shadow-sm">
                    <Server className="w-3 h-3" />
                    Host Machine
                </div>
                
                {/* Active Indicator */}
                { (simulationStep === 2 || simulationStep === 3 || simulationStep === 4) && (
                    <div className="absolute inset-0 border-2 border-blue-500/30 rounded-xl animate-pulse"></div>
                )}

                <div className="flex flex-col items-center gap-3 w-32 shrink-0">
                    <div className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-300 ${
                        selectedNode === 'host'
                        ? 'bg-blue-500/20 border-2 border-blue-500 shadow-blue-500/20'
                        : 'bg-blue-500/10 border border-blue-500/30 shadow-[0_0_15px_-3px_rgba(59,130,246,0.3)]'
                    }`}>
                        {simulationStep === 3 ? (
                            <div className="w-8 h-8 relative">
                                <div className="absolute inset-0 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
                                <div className="absolute inset-2 border-2 border-indigo-400 border-b-transparent rounded-full animate-spin direction-reverse"></div>
                            </div>
                        ) : (
                            <Server className={`w-8 h-8 ${selectedNode === 'host' ? 'text-blue-300' : 'text-blue-400'}`} />
                        )}
                    </div>
                    <div className="text-center">
                        <h4 className={`text-sm font-semibold transition-colors ${selectedNode === 'host' ? 'text-blue-300' : 'text-slate-200'}`}>Gemini API</h4>
                        <p className="text-[10px] text-slate-500 font-mono">Port 5123</p>
                    </div>
                </div>
            </div>
        </div>

        {/* Info Panel (Bottom Sheet) */}
        {selectedNode && (
            <div className="mt-8 animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="bg-slate-950/50 rounded-xl border border-slate-800 p-4 relative shadow-2xl shadow-black/50">
                    <button 
                        onClick={(e) => { e.stopPropagation(); setSelectedNode(null); }}
                        className="absolute top-2 right-2 text-slate-500 hover:text-white p-1 hover:bg-slate-800 rounded transition-colors"
                    >
                        <X className="w-4 h-4" />
                    </button>
                    
                    <div className="flex items-start gap-4">
                        <div className="p-2 bg-slate-800 rounded-lg hidden sm:block">
                            <Info className="w-5 h-5 text-slate-400" />
                        </div>
                        <div className="flex-1">
                            <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                                {NODE_DETAILS[selectedNode].title}
                                <span className="text-[10px] font-normal text-slate-500 border border-slate-700 px-1.5 py-0.5 rounded">Selected</span>
                            </h3>
                            <p className="text-xs text-slate-400 mt-1 mb-3">
                                {NODE_DETAILS[selectedNode].description}
                            </p>
                            
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                                {NODE_DETAILS[selectedNode].specs.map((spec, i) => (
                                    <div key={i} className="bg-slate-900 p-2 rounded border border-slate-800/50 flex flex-col justify-center">
                                        <div className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold mb-0.5">{spec.label}</div>
                                        <div className="text-xs text-slate-200 font-mono truncate" title={spec.value}>{spec.value}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )}
      </div>

      <style>{`
        @keyframes moveRight {
            0% { left: 0%; opacity: 0; transform: translateY(-50%) scale(0.8); }
            10% { opacity: 1; transform: translateY(-50%) scale(1); }
            90% { opacity: 1; transform: translateY(-50%) scale(1); }
            100% { left: 100%; opacity: 0; transform: translateY(-50%) scale(0.8); }
        }
        @keyframes moveLeft {
            0% { right: 0%; opacity: 0; transform: translateY(-50%) scale(0.8); }
            10% { opacity: 1; transform: translateY(-50%) scale(1); }
            90% { opacity: 1; transform: translateY(-50%) scale(1); }
            100% { right: 100%; opacity: 0; transform: translateY(-50%) scale(0.8); }
        }
      `}</style>
    </div>
  );
};