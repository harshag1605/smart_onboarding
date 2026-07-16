import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { fork } from 'child_process';
import { createProxyMiddleware } from 'http-proxy-middleware';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(cors({
  origin: [
    'http://localhost:5173',
    'https://smart-onboarding-zeta.vercel.app'
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

const PORT = process.env.PORT || 3000;

// Start Microservices
const startService = (scriptPath, name) => {
  const child = fork(scriptPath);
  child.on('error', (err) => console.error(`[${name}] Error:`, err));
  child.on('exit', (code) => console.log(`[${name}] Exited with code ${code}`));
  return child;
};

console.log('Starting Microservices...');
startService(path.join(__dirname, 'services', 'auth-server.js'), 'Auth Service');
startService(path.join(__dirname, 'services', 'ai-server.js'), 'AI Service');
startService(path.join(__dirname, 'services', 'crud-server.js'), 'CRUD Service');

// API Gateway Proxies
// Note: We do not use express.json() here because it consumes the body, 
// which breaks HTTP proxying for POST/PUT requests (especially file uploads).

app.use(createProxyMiddleware({
  pathFilter: '/api/auth',
  target: 'http://localhost:3001',
  changeOrigin: true
}));

app.use(createProxyMiddleware({
  pathFilter: '/api/hr/upload',
  target: 'http://localhost:3002',
  changeOrigin: true
}));

app.use(createProxyMiddleware({
  pathFilter: '/api/hr',
  target: 'http://localhost:3003',
  changeOrigin: true
}));

app.use(createProxyMiddleware({
  pathFilter: '/api/employee',
  target: 'http://localhost:3003',
  changeOrigin: true
}));

app.listen(PORT, '0.0.0.0', () => {
  console.log(`API Gateway running on http://localhost:${PORT}`);
});
