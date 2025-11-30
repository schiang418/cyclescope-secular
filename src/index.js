#!/usr/bin/env node

/**
 * CycleScope Secular - Main Entry Point
 * 
 * This is a simple health check server for Railway deployment.
 * The actual chart download will be triggered by GitHub Actions.
 */

import http from 'http';
import { config } from './config.js';

const PORT = process.env.PORT || 3000;

// Simple health check server
const server = http.createServer((req, res) => {
  if (req.url === '/health' || req.url === '/') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'ok',
      service: 'cyclescope-secular',
      timestamp: new Date().toISOString(),
      config: {
        dataDir: config.storage.dataDir,
        retentionDays: config.storage.retentionDays,
        chartUrl: config.tradingview.chartUrl
      }
    }));
  } else {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      error: 'Not found',
      message: 'This service runs scheduled tasks via GitHub Actions'
    }));
  }
});

server.listen(PORT, () => {
  console.log(`[Server] CycleScope Secular health check server running on port ${PORT}`);
  console.log(`[Server] Health check: http://localhost:${PORT}/health`);
  console.log(`[Server] Data directory: ${config.storage.dataDir}`);
  console.log(`[Server] Chart URL: ${config.tradingview.chartUrl}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('[Server] SIGTERM received, shutting down gracefully...');
  server.close(() => {
    console.log('[Server] Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('[Server] SIGINT received, shutting down gracefully...');
  server.close(() => {
    console.log('[Server] Server closed');
    process.exit(0);
  });
});
