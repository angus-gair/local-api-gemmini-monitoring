export enum Tab {
  OVERVIEW = 'overview',
  CONFIGURATION = 'configuration',
  TESTING = 'testing',
  LOGS = 'logs',
  TROUBLESHOOTING = 'troubleshooting',
}

export interface ConfigFile {
  name: string;
  path: string;
  language: string;
  content: string;
  description?: string;
}

export interface EndpointDef {
  name: string;
  method: 'GET' | 'POST';
  url: string;
  description: string;
  curlCommand: string;
}

export interface HealthResponse {
  status: string;
  timestamp: number;
  adapter: string;
  healthy: boolean;
}

export interface ServiceStatus {
  name: string;
  status: 'operational' | 'degraded' | 'down' | 'unknown';
  latency?: number;
  lastChecked?: Date;
}

export interface LogEntry {
  id: string;
  timestamp: Date;
  raw: string;
  type: 'access' | 'system' | 'error';
  metadata?: {
    method?: string;
    path?: string;
    status?: number;
    ip?: string;
    userAgent?: string;
    query?: string;
  };
}