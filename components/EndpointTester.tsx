import React, { useState } from 'react';
import { EndpointDef } from '../types';
import { Play, AlertCircle, CheckCircle2, Loader2, Copy } from 'lucide-react';

interface Props {
  endpoint: EndpointDef;
}

export const EndpointTester: React.FC<Props> = ({ endpoint }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState<string | null>(null);
  const [status, setStatus] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleTest = async () => {
    setIsLoading(true);
    setResponse(""); // Initialize empty string for streaming
    setStatus(null);
    setError(null);

    try {
      const opts: RequestInit = {
        method: endpoint.method,
        headers: {
            'Content-Type': 'application/json'
        }
      };
      
      const isChatEndpoint = endpoint.url.includes('/chat/completions');

      if (endpoint.method === 'POST') {
          // Simple test body for chat
          opts.body = JSON.stringify({
              model: "gemini-pro",
              messages: [{ role: "user", content: "Hello, are you online?" }],
              stream: isChatEndpoint // Enable streaming for chat
          });
      }

      const startTime = performance.now();
      const res = await fetch(endpoint.url, opts);
      const endTime = performance.now();
      
      setStatus(res.status);

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`HTTP Error: ${res.status} ${res.statusText}\n${text}`);
      }
      
      if (isChatEndpoint && res.body) {
          // Handle SSE Streaming
          const reader = res.body.getReader();
          const decoder = new TextDecoder();
          let buffer = '';
          let accumulatedResponse = '';

          while (true) {
              const { done, value } = await reader.read();
              if (done) break;

              buffer += decoder.decode(value, { stream: true });
              const lines = buffer.split('\n');
              buffer = lines.pop() || ''; // Keep incomplete line

              for (const line of lines) {
                  const trimmed = line.trim();
                  if (trimmed.startsWith('data: ')) {
                      const dataStr = trimmed.slice(6);
                      if (dataStr === '[DONE]') continue;
                      
                      try {
                          const data = JSON.parse(dataStr);
                          const content = data.choices?.[0]?.delta?.content || '';
                          accumulatedResponse += content;
                          setResponse(accumulatedResponse);
                      } catch (e) {
                          console.warn('Failed to parse SSE chunk', e);
                      }
                  }
              }
          }
      } else {
          // Handle standard JSON response
          const data = await res.json().catch(() => ({ error: "Could not parse JSON" }));
          setResponse(JSON.stringify(data, null, 2));
      }
      
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Unknown error occurred");
      if (status === null) setStatus(0);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (s: number | null) => {
    if (!s) return 'bg-slate-700';
    if (s >= 200 && s < 300) return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
    return 'bg-red-500/20 text-red-400 border-red-500/30';
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 mb-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className={`px-2 py-0.5 text-xs font-bold rounded ${endpoint.method === 'GET' ? 'bg-blue-500/20 text-blue-400' : 'bg-green-500/20 text-green-400'}`}>
              {endpoint.method}
            </span>
            <h4 className="font-mono text-sm text-slate-200">{endpoint.url}</h4>
          </div>
          <p className="text-slate-500 text-sm mt-1">{endpoint.description}</p>
        </div>
        
        <button
          onClick={handleTest}
          disabled={isLoading}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-slate-800 hover:bg-primary-600 text-slate-200 hover:text-white rounded-md transition-colors text-sm border border-slate-700 hover:border-primary-500 disabled:opacity-50 disabled:cursor-not-allowed min-w-[100px]"
        >
          {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4 fill-current" />}
          {isLoading ? 'Testing...' : 'Test Endpoint'}
        </button>
      </div>

      {/* Code Snippet for Curl */}
      <div className="bg-slate-950 rounded border border-slate-800 p-3 font-mono text-xs text-slate-400 overflow-x-auto flex justify-between items-start group">
        <pre>{endpoint.curlCommand}</pre>
        <button 
            onClick={() => navigator.clipboard.writeText(endpoint.curlCommand)}
            className="opacity-0 group-hover:opacity-100 p-1 hover:bg-slate-800 rounded text-slate-500 hover:text-slate-200 transition-all"
            title="Copy cURL"
        >
            <Copy className="w-3 h-3" />
        </button>
      </div>

      {/* Response Area */}
      {(response || error) && (
        <div className="mt-4 animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Response</span>
                {status !== null && (
                    <div className={`px-2 py-0.5 rounded text-xs border ${getStatusColor(status)}`}>
                        Status: {status}
                    </div>
                )}
            </div>
            
            {error && (
                <div className="mb-2 p-3 bg-red-500/10 border border-red-500/20 rounded text-red-400 text-xs flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <div>
                        <p className="font-semibold">Request Failed</p>
                        <p className="whitespace-pre-wrap">{error}</p>
                        <p className="mt-1 opacity-70">Note: If testing from localhost, ensure CORS is enabled or use the cURL command.</p>
                    </div>
                </div>
            )}

            {response && (
                <div className="relative">
                    <pre className="bg-slate-950 p-4 rounded border border-slate-800 text-xs text-emerald-300 font-mono overflow-auto max-h-[300px] whitespace-pre-wrap">
                        {response}
                        {isLoading && <span className="inline-block w-2 h-4 ml-1 bg-emerald-500 animate-pulse align-middle"></span>}
                    </pre>
                </div>
            )}
        </div>
      )}
    </div>
  );
};
