import { ConfigFile, EndpointDef } from './types';

export const API_BASE_URL = "https://gemini.ajinsights.com.au";

export const CONFIG_FILES: ConfigFile[] = [
  {
    name: "Traefik Dynamic Config",
    path: "/home/ghost/projects/deployment/config/traefik/dynamic/gemini-api.yml",
    language: "yaml",
    description: "Defines the direct routing from public HTTPS to the host systemd service.",
    content: `http:
  routers:
    gemini-api:
      rule: "Host(\`gemini.ajinsights.com.au\`)"
      service: gemini-api
      entryPoints:
        - websecure
      tls:
        certResolver: letsencrypt
      middlewares:
        - default-chain@file

  services:
    gemini-api:
      loadBalancer:
        servers:
          - url: "http://host.docker.internal:5123"
        passHostHeader: true
        responseForwarding:
          flushInterval: "100ms"  # Enables streaming/SSE support`
  },
  {
    name: "Traefik Main Config",
    path: "/home/ghost/projects/deployment/config/traefik/docker-compose.yml",
    language: "yaml",
    description: "Docker Compose snippet showing the required extra_hosts configuration.",
    content: `services:
  traefik:
    # ... other config ...
    extra_hosts:
      - "host.docker.internal:host-gateway"`
  },
  {
    name: "Systemd Service",
    path: "/etc/systemd/system/gemini-cli-server.service",
    language: "ini",
    description: "The backend service running on the host machine (port 5123).",
    content: `[Unit]
Description=Gemini API Server
After=network.target

[Service]
Type=simple
User=ghost
WorkingDirectory=/home/ghost/local-api-gemini/
ExecStart=/usr/bin/node server.js
Restart=always
Environment=PORT=5123

[Install]
WantedBy=multi-user.target`
  }
];

export const ENDPOINTS: EndpointDef[] = [
  {
    name: "Health Check",
    method: "GET",
    url: `${API_BASE_URL}/health`,
    description: "Verifies the systemd service is reachable and functioning.",
    curlCommand: `curl ${API_BASE_URL}/health`
  },
  {
    name: "List Models",
    method: "GET",
    url: `${API_BASE_URL}/v1/models`,
    description: "Lists available models from the proxy provider.",
    curlCommand: `curl ${API_BASE_URL}/v1/models`
  },
  {
    name: "Chat Completions",
    method: "POST",
    url: `${API_BASE_URL}/v1/chat/completions`,
    description: "OpenAI-compatible chat completion endpoint.",
    curlCommand: `curl -X POST ${API_BASE_URL}/v1/chat/completions \\
  -H "Content-Type: application/json" \\
  -d '{"model": "gemini-pro", "messages": [{"role": "user", "content": "Hello!"}]}'`
  }
];

export const TROUBLESHOOTING_STEPS = [
  {
    title: "SSL Certificate Issues",
    command: "docker logs traefik 2>&1 | grep -i acme",
    desc: "Check Traefik logs for Let's Encrypt errors."
  },
  {
    title: "Routing Verification",
    command: "curl -s http://localhost:8080/api/http/routers | jq '.[] | select(.name | contains(\"gemini\"))'",
    desc: "Verify the router is loaded in Traefik's internal API."
  },
  {
    title: "Host Connectivity",
    command: "docker exec traefik wget -qO- http://host.docker.internal:5123/health",
    desc: "Confirm the container can reach the host service."
  }
];