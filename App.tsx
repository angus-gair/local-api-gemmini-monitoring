import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Settings, 
  Terminal, 
  Activity, 
  Server, 
  ShieldCheck, 
  Globe, 
  Cpu, 
  AlertTriangle, 
  Copy,
  Check,
  ScrollText,
  ArrowUpRight,
  Clock,
  User,
  MessageSquare,
  Monitor
} from 'lucide-react';
import { Tab, ServiceStatus, HealthResponse, LogEntry } from './types';
import { API_BASE_URL, CONFIG_FILES, ENDPOINTS, TROUBLESHOOTING_STEPS } from './constants';
import { ArchitectureDiagram } from './components/ArchitectureDiagram';
import { EndpointTester } from './components/EndpointTester';
import { LogViewer } from './components/LogViewer';
import { GeminiTroubleshooter } from './components/GeminiTroubleshooter';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>(Tab.OVERVIEW);
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [healthLoading, setHealthLoading] = useState(false);
  const [healthError, setHealthError] = useState(false);
  const [copiedPath, setCopiedPath] = useState<string | null>(null);
  
  // Log State (Lifted from LogViewer)
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const MAX_LOGS = 500;

  // Dummy data for chart visual
  const [latencyData] = useState([
    { name: '10:00', ms: 45 },
    { name: '10:05', ms: 42 },
    { name: '10:10', ms: 48 },
    { name: '10:15', ms: 120 },
    { name: '10:20', ms: 44 },
    { name: '10:25', ms: 41 },
    { name: '10:30', ms: 43 },
  ]);

  // Global Log Generation (Simulates Server Logs)
  useEffect(() => {
    const generateLog = () => {
      const methods = ['GET', 'POST', 'OPTIONS'];
      const paths = ['/health', '/v1/models', '/v1/chat/completions', '/'];
      const statuses = [200, 200, 200, 200, 204, 400, 401, 500];
      const userAgents = [
          { name: 'Mozilla/5.0', icon: 'browser' }, 
          { name: 'curl/7.68.0', icon: 'terminal' }, 
          { name: 'PostmanRuntime/7.29.0', icon: 'app' }, 
          { name: 'OpenAI/v1 PythonBindings/0.27.0', icon: 'code' }
      ];
      const queries = [
          "Explain quantum entanglement",
          "Debug this Python script",
          "What is the capital of France?",
          "Generate a React component for a Navbar",
          "Summarize this text",
          "How do I configure Traefik?",
          "Translate 'Hello' to Spanish"
      ];
      
      const now = new Date();
      const rand = Math.random();
      
      let logLine = '';
      let type: LogEntry['type'] = 'access';
      let metadata: LogEntry['metadata'] = {};

      if (rand > 0.92) {
        // Traefik System Log
        const msgs = [
            'Configuration reloaded',
            'Refreshing service health status',
            'Skipping middleware "auth" for route gemini-api@file',
            'Provider connection established'
        ];
        const msg = msgs[Math.floor(Math.random() * msgs.length)];
        logLine = `time="${now.toISOString()}" level=debug msg="${msg}" router="gemini-api@file"`;
        type = 'system';
      } else if (rand > 0.85) {
        // Systemd Service Log (gemini-cli-server)
        const serviceMsgs = [
            'INFO: Processing chat completion request',
            'DEBUG: Stream chunk sent (124 bytes)',
            'INFO: Health check probe received',
            'WARN: High memory usage detected (heap: 85%)',
            'INFO: Model gemini-2.5-flash loaded successfully',
            'ERROR: Upstream timeout (Google API)',
            'DEBUG: Garbage collection complete'
        ];
        const msg = serviceMsgs[Math.floor(Math.random() * serviceMsgs.length)];
        const ts = now.toLocaleTimeString('en-US', { hour12: false });
        logLine = `${ts} gemini-cli-server[5123]: ${msg}`;
        type = msg.includes('ERROR') ? 'error' : 'system';
      } else {
        // Access Log
        let method = methods[Math.floor(Math.random() * methods.length)];
        let path = paths[Math.floor(Math.random() * paths.length)];
        
        // Correlate method with path slightly for realism
        if (path === '/v1/chat/completions') method = 'POST';
        if (path === '/health') method = 'GET';

        const status = statuses[Math.floor(Math.random() * statuses.length)];
        const duration = Math.floor(Math.random() * 500) + 5;
        const ip = `172.18.0.${Math.floor(Math.random() * 255)}`;
        const ua = userAgents[Math.floor(Math.random() * userAgents.length)];
        
        // Determine query if applicable
        let query = undefined;
        if (path === '/v1/chat/completions' && method === 'POST') {
            query = queries[Math.floor(Math.random() * queries.length)];
        }

        logLine = `${ip} - - [${now.toUTCString()}] "${method} ${path} HTTP/2.0" ${status} ${Math.floor(Math.random() * 1000)} "-" "${ua.name}" ${Math.floor(Math.random() * 100)} "gemini-api@file" "http://host.docker.internal:5123" ${duration}ms`;
        
        if (status >= 400) type = 'error';

        metadata = {
            method,
            path,
            status,
            ip,
            userAgent: ua.name,
            query
        };
      }

      const newLog: LogEntry = {
        id: Math.random().toString(36).substring(7),
        timestamp: now,
        raw: logLine,
        type,
        metadata
      };

      setLogs(prev => {
        const updated = [...prev, newLog];
        return updated.slice(-MAX_LOGS);
      });
    };

    const interval = setInterval(generateLog, Math.random() * 2000 + 1000);
    return () => clearInterval(interval);
  }, []);

  const fetchHealth = async () => {
    setHealthLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/health`);
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      setHealth(data);
      setHealthError(false);
    } catch (e) {
      setHealthError(true);
    } finally {
      setHealthLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
    const interval = setInterval(fetchHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedPath(text);
    setTimeout(() => setCopiedPath(null), 2000);
  };

  const renderSidebar = () => (
    <div className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col h-screen fixed left-0 top-0 z-20 hidden md:flex">
      <div className="p-6 border-b border-slate-800">
        <div className="flex items-center gap-2 text-primary-500 mb-1">
            <Server className="w-6 h-6" />
            <span className="font-bold tracking-tight text-white">GEMINI OPS</span>
        </div>
        <div className="text-xs text-slate-500 font-mono">v1.0.0 • Traefik Route</div>
      </div>
      
      <nav className="flex-1 p-4 space-y-1">
        <button 
            onClick={() => setActiveTab(Tab.OVERVIEW)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${activeTab === Tab.OVERVIEW ? 'bg-primary-500/10 text-primary-400 border border-primary-500/20' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'}`}
        >
          <LayoutDashboard className="w-4 h-4" />
          Overview
        </button>
        <button 
            onClick={() => setActiveTab(Tab.CONFIGURATION)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${activeTab === Tab.CONFIGURATION ? 'bg-primary-500/10 text-primary-400 border border-primary-500/20' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'}`}
        >
          <Settings className="w-4 h-4" />
          Configuration
        </button>
        <button 
            onClick={() => setActiveTab(Tab.LOGS)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${activeTab === Tab.LOGS ? 'bg-primary-500/10 text-primary-400 border border-primary-500/20' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'}`}
        >
          <ScrollText className="w-4 h-4" />
          Live Logs
        </button>
        <button 
            onClick={() => setActiveTab(Tab.TESTING)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${activeTab === Tab.TESTING ? 'bg-primary-500/10 text-primary-400 border border-primary-500/20' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'}`}
        >
          <Terminal className="w-4 h-4" />
          Test Console
        </button>
        <button 
            onClick={() => setActiveTab(Tab.TROUBLESHOOTING)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${activeTab === Tab.TROUBLESHOOTING ? 'bg-primary-500/10 text-primary-400 border border-primary-500/20' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'}`}
        >
          <Activity className="w-4 h-4" />
          Troubleshooting
        </button>
      </nav>

      <div className="p-4 border-t border-slate-800">
        <div className="bg-slate-950 rounded-lg p-3 border border-slate-800">
            <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-slate-500">System Status</span>
                <span className={`w-2 h-2 rounded-full ${healthError ? 'bg-red-500' : 'bg-emerald-500 animate-pulse'}`}></span>
            </div>
            <div className="text-sm font-mono text-slate-300 truncate">
                {healthError ? 'Offline' : 'Operational'}
            </div>
        </div>
      </div>
    </div>
  );

  const renderOverview = () => {
    // Helper to get last 3 access logs
    const recentRequests = logs
        .filter(l => l.type === 'access' && l.metadata)
        .slice(-3)
        .reverse()
        .map(l => {
            // Use metadata if available, otherwise minimal fallback
            return {
                id: l.id,
                method: l.metadata?.method || 'UNK',
                path: l.metadata?.path || 'unknown',
                status: l.metadata?.status || 0,
                ip: l.metadata?.ip || '-',
                userAgent: l.metadata?.userAgent || '-',
                query: l.metadata?.query,
                time: l.timestamp
            };
        });

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 p-4 rounded-xl">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-slate-400 text-xs uppercase font-bold tracking-wider">API Status</h3>
                        <ShieldCheck className="w-4 h-4 text-emerald-500" />
                    </div>
                    <div className="text-2xl font-semibold text-white mb-1">
                        {healthError ? 'Unreachable' : (health?.healthy ? 'Healthy' : 'Checking...')}
                    </div>
                    <div className="text-xs text-slate-500 font-mono">
                        {healthError ? 'Connection Refused' : `${API_BASE_URL}`}
                    </div>
                </div>

                <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 p-4 rounded-xl">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-slate-400 text-xs uppercase font-bold tracking-wider">Public IP</h3>
                        <Globe className="w-4 h-4 text-blue-500" />
                    </div>
                    <div className="text-2xl font-semibold text-white mb-1">
                        180.181.228.230
                    </div>
                    <div className="text-xs text-slate-500 font-mono">
                       DigitalOcean / DNS A Record
                    </div>
                </div>

                <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 p-4 rounded-xl">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-slate-400 text-xs uppercase font-bold tracking-wider">Host Port</h3>
                        <Cpu className="w-4 h-4 text-orange-500" />
                    </div>
                    <div className="text-2xl font-semibold text-white mb-1">
                        :5123
                    </div>
                    <div className="text-xs text-slate-500 font-mono">
                       systemd / node server.js
                    </div>
                </div>
            </div>

            <ArchitectureDiagram />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Recent Requests Card */}
                <div className="bg-slate-900 rounded-xl border border-slate-800 p-6 flex flex-col">
                    <div className="flex items-center justify-between mb-4">
                         <h3 className="text-slate-200 font-medium">Live Traffic</h3>
                         <div className="p-1.5 bg-slate-800 rounded">
                             <ArrowUpRight className="w-4 h-4 text-slate-400" />
                         </div>
                    </div>
                    <div className="flex-1 space-y-3">
                        {recentRequests.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-slate-500 text-sm">
                                <Clock className="w-8 h-8 mb-2 opacity-20" />
                                Waiting for traffic...
                            </div>
                        ) : (
                            recentRequests.map((req) => (
                                <div key={req.id} className="flex flex-col gap-2 p-3 bg-slate-950/50 rounded border border-slate-800/50 hover:border-slate-700 transition-colors group">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2 overflow-hidden">
                                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase ${
                                                req.method === 'GET' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' : 
                                                req.method === 'POST' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 
                                                'bg-slate-700 text-slate-400'
                                            }`}>
                                                {req.method}
                                            </span>
                                            <span className="font-mono text-xs text-slate-300 truncate" title={req.path}>
                                                {req.path}
                                            </span>
                                        </div>
                                        <div className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${req.status >= 400 ? 'bg-red-500/10 text-red-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
                                            {req.status}
                                        </div>
                                    </div>
                                    
                                    <div className="flex items-center justify-between text-[10px] text-slate-500">
                                        <div className="flex items-center gap-1.5 max-w-[70%]">
                                            <User className="w-3 h-3 text-slate-600" />
                                            <span className="font-mono">{req.ip}</span>
                                            <span className="mx-1 text-slate-700">|</span>
                                            <span className="truncate" title={req.userAgent}>{req.userAgent}</span>
                                        </div>
                                        <span>
                                            {req.time.toLocaleTimeString([], { hour12: false, hour: '2-digit', minute:'2-digit', second:'2-digit' })}
                                        </span>
                                    </div>

                                    {req.query && (
                                        <div className="flex items-start gap-2 mt-1 px-2 py-1.5 bg-indigo-500/5 border border-indigo-500/10 rounded text-[11px] text-indigo-300/90 font-mono">
                                            <MessageSquare className="w-3 h-3 shrink-0 mt-0.5 opacity-50" />
                                            <span className="truncate">"{req.query}"</span>
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </div>

                <div className="bg-slate-900 rounded-xl border border-slate-800 p-6">
                    <h3 className="text-slate-200 font-medium mb-4">Recent Latency (ms)</h3>
                    <div className="h-[200px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={latencyData}>
                                <XAxis dataKey="name" stroke="#475569" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis stroke="#475569" fontSize={12} tickLine={false} axisLine={false} />
                                <Tooltip 
                                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#f1f5f9' }}
                                    itemStyle={{ color: '#3b82f6' }}
                                    cursor={{ fill: 'rgba(59, 130, 246, 0.1)' }}
                                />
                                <Bar dataKey="ms" radius={[4, 4, 0, 0]}>
                                    {latencyData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.ms > 100 ? '#ef4444' : '#3b82f6'} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="bg-slate-900 rounded-xl border border-slate-800 p-6">
                    <h3 className="text-slate-200 font-medium mb-4">Deployment Info</h3>
                    <div className="space-y-4">
                        <div className="flex justify-between items-center py-3 border-b border-slate-800">
                            <span className="text-sm text-slate-400">Strategy</span>
                            <span className="text-sm text-slate-200 font-medium">Traefik File-Based</span>
                        </div>
                        <div className="flex justify-between items-center py-3 border-b border-slate-800">
                            <span className="text-sm text-slate-400">SSL Provider</span>
                            <span className="text-sm text-slate-200 font-medium">Let's Encrypt</span>
                        </div>
                        <div className="flex justify-between items-center py-3 border-b border-slate-800">
                            <span className="text-sm text-slate-400">Last Update</span>
                            <span className="text-sm text-slate-200 font-medium">2025-11-20</span>
                        </div>
                        <div className="flex justify-between items-center py-3">
                            <span className="text-sm text-slate-400">Network Mode</span>
                            <span className="px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-medium border border-emerald-500/20">Direct Host</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
  };

  const renderConfig = () => (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="bg-blue-900/20 border border-blue-500/30 p-4 rounded-lg flex gap-3 items-start">
            <AlertTriangle className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
            <div>
                <h4 className="text-blue-400 font-medium text-sm">Source of Truth</h4>
                <p className="text-blue-300/70 text-sm mt-1">
                    The configurations below are the live definitions used on the server. 
                    Modifying the dynamic config file triggers an immediate Traefik reload without container restarts.
                </p>
            </div>
        </div>

        {CONFIG_FILES.map((file, idx) => (
            <div key={idx} className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 bg-slate-950 border-b border-slate-800">
                    <div className="flex items-center gap-3">
                        <div className="p-1.5 bg-slate-800 rounded text-slate-400">
                           <Terminal className="w-4 h-4" />
                        </div>
                        <div>
                            <h3 className="text-sm font-medium text-slate-200">{file.name}</h3>
                            <p className="text-xs text-slate-500 font-mono">{file.path}</p>
                        </div>
                    </div>
                    <button 
                        onClick={() => copyToClipboard(file.content)}
                        className="p-2 hover:bg-slate-800 rounded text-slate-400 hover:text-white transition-colors"
                        title="Copy content"
                    >
                        {copiedPath === file.content ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                    </button>
                </div>
                <div className="p-4 bg-slate-900">
                    <p className="text-sm text-slate-500 mb-4">{file.description}</p>
                    <pre className="text-sm font-mono text-slate-300 overflow-x-auto p-4 bg-slate-950 rounded-lg border border-slate-800">
                        <code className={`language-${file.language}`}>{file.content}</code>
                    </pre>
                </div>
            </div>
        ))}
    </div>
  );

  const renderTesting = () => (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-slate-200">API Test Console</h2>
            <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${healthError ? 'bg-red-500' : 'bg-emerald-500'}`}></span>
                <span className="text-sm text-slate-400">{healthError ? 'API Unreachable' : 'API Ready'}</span>
            </div>
        </div>

        <div className="space-y-2">
            {ENDPOINTS.map((endpoint, idx) => (
                <EndpointTester key={idx} endpoint={endpoint} />
            ))}
        </div>
    </div>
  );

  const renderTroubleshooting = () => (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
         <h2 className="text-xl font-semibold text-slate-200">Troubleshooting Guide</h2>
         
         {/* Gemini Troubleshooter injected here */}
         <GeminiTroubleshooter logs={logs} />
         
         <div className="grid gap-4">
            {TROUBLESHOOTING_STEPS.map((step, idx) => (
                <div key={idx} className="bg-slate-900 border border-slate-800 p-5 rounded-xl hover:border-slate-700 transition-colors">
                    <h3 className="text-lg font-medium text-slate-200 mb-2">{step.title}</h3>
                    <p className="text-slate-400 text-sm mb-4">{step.desc}</p>
                    <div className="bg-slate-950 rounded border border-slate-800 p-3 font-mono text-xs text-orange-300 flex justify-between items-center group">
                        <span>{step.command}</span>
                        <button 
                            onClick={() => copyToClipboard(step.command)}
                            className="opacity-50 group-hover:opacity-100 hover:text-white"
                        >
                           {copiedPath === step.command ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        </button>
                    </div>
                </div>
            ))}
         </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans flex">
      {renderSidebar()}
      
      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 bg-slate-900 border-b border-slate-800 p-4 z-30 flex justify-between items-center">
         <span className="font-bold text-primary-500">GEMINI OPS</span>
         <div className="flex gap-2">
            <button onClick={() => setActiveTab(Tab.OVERVIEW)} className={`p-2 rounded ${activeTab === Tab.OVERVIEW ? 'bg-slate-800 text-white' : 'text-slate-400'}`}><LayoutDashboard className="w-5 h-5" /></button>
            <button onClick={() => setActiveTab(Tab.LOGS)} className={`p-2 rounded ${activeTab === Tab.LOGS ? 'bg-slate-800 text-white' : 'text-slate-400'}`}><ScrollText className="w-5 h-5" /></button>
            <button onClick={() => setActiveTab(Tab.TESTING)} className={`p-2 rounded ${activeTab === Tab.TESTING ? 'bg-slate-800 text-white' : 'text-slate-400'}`}><Terminal className="w-5 h-5" /></button>
         </div>
      </div>

      <main className="flex-1 md:ml-64 p-4 md:p-8 pt-20 md:pt-8 max-w-7xl mx-auto w-full">
        <div className="mb-8">
            <h1 className="text-3xl font-bold text-white tracking-tight mb-2 capitalize">
                {activeTab.replace(/([A-Z])/g, ' $1').trim()}
            </h1>
            <p className="text-slate-400">
                {activeTab === Tab.OVERVIEW && 'System architecture and real-time metrics.'}
                {activeTab === Tab.CONFIGURATION && 'Routing rules and host service definitions.'}
                {activeTab === Tab.LOGS && 'Real-time stream of Traefik access logs filtered for Gemini.'}
                {activeTab === Tab.TESTING && 'Interactive API playground and connectivity check.'}
                {activeTab === Tab.TROUBLESHOOTING && 'Diagnostics and common resolution steps.'}
            </p>
        </div>

        {activeTab === Tab.OVERVIEW && renderOverview()}
        {activeTab === Tab.CONFIGURATION && renderConfig()}
        {activeTab === Tab.LOGS && <LogViewer logs={logs} onClear={() => setLogs([])} />}
        {activeTab === Tab.TESTING && renderTesting()}
        {activeTab === Tab.TROUBLESHOOTING && renderTroubleshooting()}
      </main>
    </div>
  );
};

export default App;