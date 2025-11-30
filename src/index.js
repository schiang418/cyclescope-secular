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
import { downloadStockChart } from './services/stockcharts-downloader.js';
import { getCurrentDate } from './utils/date.js';

const PORT = process.env.PORT || 3000;

// Background job tracking
let downloadStatus = {
  isRunning: false,
  lastStartTime: null,
  lastEndTime: null,
  lastSuccess: null,
  lastError: null,
  lastFilePath: null
};

/**
 * Background download function
 * Runs asynchronously without blocking the HTTP server
 */
async function runDownloadInBackground(date) {
  downloadStatus.isRunning = true;
  downloadStatus.lastStartTime = new Date().toISOString();
  downloadStatus.lastError = null;
  
  console.log(`[Background] Starting chart download for date: ${date}`);
  
  try {
    const filePath = await downloadStockChart(date);
    
    downloadStatus.isRunning = false;
    downloadStatus.lastEndTime = new Date().toISOString();
    downloadStatus.lastSuccess = true;
    downloadStatus.lastFilePath = filePath;
    
    console.log(`[Background] Chart downloaded successfully: ${filePath}`);
  } catch (error) {
    downloadStatus.isRunning = false;
    downloadStatus.lastEndTime = new Date().toISOString();
    downloadStatus.lastSuccess = false;
    downloadStatus.lastError = error.message;
    
    console.error('[Background] Download failed:', error);
  }
}

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
        chartUrl: config.stockcharts.chartUrl
      },
      downloadStatus: downloadStatus
    }));
  }
  // Download status endpoint
  else if (req.url === '/download-status' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      success: true,
      status: downloadStatus,
      timestamp: new Date().toISOString()
    }));
  }
  // Download chart endpoint (async, returns immediately)
  else if (req.url === '/download' && req.method === 'POST') {
    console.log('[API] Download request received');
    
    if (downloadStatus.isRunning) {
      res.writeHead(409, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: false,
        message: 'Download already in progress',
        status: downloadStatus,
        timestamp: new Date().toISOString()
      }));
      return;
    }
    
    const date = getCurrentDate();
    
    // Start download in background (don't await)
    runDownloadInBackground(date).catch(err => {
      console.error('[Background] Unexpected error:', err);
    });
    
    // Return immediately
    res.writeHead(202, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      success: true,
      message: 'Download started in background',
      date: date,
      status: 'processing',
      timestamp: new Date().toISOString(),
      statusUrl: '/download-status'
    }));
  }
  // Download chart and return file endpoint (waits for completion)
  else if (req.url === '/download-file' && req.method === 'POST') {
    console.log('[API] Download-file request received');
    
    try {
      const date = getCurrentDate();
      
      // Check if download is already running
      if (downloadStatus.isRunning) {
        res.writeHead(409, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: false,
          message: 'Download already in progress, please wait and try again',
          timestamp: new Date().toISOString()
        }));
        return;
      }
      
      console.log(`[API] Starting chart download for date: ${date}`);
      
      // Download chart from StockCharts (this will take ~10-15 seconds)
      const filePath = await downloadStockChart(date);
      
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
  // Get latest chart file (if exists)
  else if (req.url === '/latest-chart' && req.method === 'GET') {
    try {
      const date = getCurrentDate();
      const filePath = `${config.storage.dataDir}/${date}/original_chart.png`;
      
      if (!fs.existsSync(filePath)) {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: false,
          message: 'No chart available for today. Please trigger /download first.',
          timestamp: new Date().toISOString()
        }));
        return;
      }
      
      const fileContent = fs.readFileSync(filePath);
      
      res.writeHead(200, {
        'Content-Type': 'image/png',
        'Content-Disposition': `inline; filename="chart-${date}.png"`,
        'Content-Length': fileContent.length
      });
      res.end(fileContent);
    } catch (error) {
      console.error('[API] Latest-chart failed:', error);
      
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
      message: 'Available endpoints: GET /health, GET /download-status, POST /download, POST /download-file, GET /latest-chart'
    }));
  }
});

server.listen(PORT, () => {
  console.log(`[Server] CycleScope Secular health check server running on port ${PORT}`);
  console.log(`[Server] Health check: http://localhost:${PORT}/health`);
  console.log(`[Server] Data directory: ${config.storage.dataDir}`);
  console.log(`[Server] Chart URL: ${config.stockcharts.chartUrl}`);
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
