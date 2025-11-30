#!/usr/bin/env node

/**
 * CycleScope Secular - Main Entry Point
 * 
 * This is a simple health check server for Railway deployment.
 * The actual chart download will be triggered by GitHub Actions.
 */

import http from 'http';
import fs from 'fs';
import { config } from './config.js';
import { downloadChartWithLoginAndRetry } from './services/tradingview-with-login.js';
import { getCurrentDate } from './utils/date.js';

const PORT = process.env.PORT || 3000;

// Simple health check server
const server = http.createServer(async (req, res) => {
  // Health check endpoint
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
  }
  // Download chart endpoint
  else if (req.url === '/download' && req.method === 'POST') {
    console.log('[API] Download request received');
    
    try {
      const date = getCurrentDate();
      console.log(`[API] Starting chart download for date: ${date}`);
      
      // Download chart with login
      const filePath = await downloadChartWithLoginAndRetry(date);
      
      console.log(`[API] Chart downloaded successfully: ${filePath}`);
      
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: true,
        message: 'Chart downloaded successfully',
        date: date,
        filePath: filePath,
        timestamp: new Date().toISOString()
      }));
    } catch (error) {
      console.error('[API] Download failed:', error);
      
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      }));
    }
  }
  // Download chart and return file endpoint
  else if (req.url === '/download-file' && req.method === 'POST') {
    console.log('[API] Download-file request received');
    
    try {
      const date = getCurrentDate();
      console.log(`[API] Starting chart download for date: ${date}`);
      
      // Download chart with login
      const filePath = await downloadChartWithLoginAndRetry(date);
      
      console.log(`[API] Chart downloaded successfully: ${filePath}`);
      console.log(`[API] Reading file to send to client...`);
      
      // Read the file
      const fileContent = fs.readFileSync(filePath);
      
      // Send the PNG file
      res.writeHead(200, {
        'Content-Type': 'image/png',
        'Content-Disposition': `attachment; filename="chart-${date}.png"`,
        'Content-Length': fileContent.length
      });
      res.end(fileContent);
      
      console.log(`[API] File sent to client successfully`);
    } catch (error) {
      console.error('[API] Download-file failed:', error);
      
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      }));
    }
  }
  // Not found
  else {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      error: 'Not found',
      message: 'Available endpoints: GET /health, POST /download, POST /download-file'
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
