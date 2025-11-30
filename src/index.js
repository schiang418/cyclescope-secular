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
import { OpenAIAssistant } from './services/openai-assistant.js';
import { database } from './services/database.js';
import { geminiAnnotator } from './services/gemini-annotator.js';

const PORT = process.env.PORT || 3000;

// Initialize database on startup
try {
  await database.initialize();
  console.log('[Server] Database initialized');
} catch (error) {
  console.error('[Server] Database initialization failed:', error);
}

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
  // Add CORS headers to all responses
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }
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
  // Analyze chart with OpenAI Assistant and save to database
  else if (req.url === '/analyze' && req.method === 'POST') {
    console.log('[API] Analyze request received');
    
    try {
      const date = getCurrentDate();
      const chartPath = `${config.storage.dataDir}/${date}/original_chart.png`;
      
      // Check if chart exists
      if (!fs.existsSync(chartPath)) {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: false,
          message: `Chart not found for date ${date}. Please run /download first.`,
          timestamp: new Date().toISOString()
        }));
        return;
      }
      
      console.log(`[API] Analyzing chart: ${chartPath}`);
      
      // Analyze with OpenAI Assistant
      const assistant = new OpenAIAssistant();
      const analysis = await assistant.analyze(chartPath, date);
      
      console.log('[API] Analysis complete, saving to database...');
      
      // Add file path to analysis
      analysis.original_chart_url = chartPath;
      
      // Annotate chart with Gemini
      console.log('[API] Annotating chart with Gemini...');
      const annotatedPath = `${config.storage.dataDir}/${date}/annotated_chart.png`;
      
      try {
        await geminiAnnotator.annotateChart(chartPath, annotatedPath, analysis.layer3);
        analysis.annotated_chart_url = annotatedPath;
        console.log('[API] Chart annotation complete');
      } catch (error) {
        console.error('[API] Chart annotation failed:', error);
        // Continue without annotation
        analysis.annotated_chart_url = null;
      }
      
      // Save to database
      const savedRecord = await database.saveAnalysis(analysis);
      
      console.log(`[API] Analysis saved to database (ID: ${savedRecord.id})`);
      
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: true,
        message: 'Analysis complete and saved to database',
        date: date,
        recordId: savedRecord.id,
        analysis: {
          layer1: analysis.layer1,
          layer2: analysis.layer2,
          layer3: analysis.layer3
        },
        timestamp: new Date().toISOString()
      }));
    } catch (error) {
      console.error('[API] Analyze failed:', error);
      
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: false,
        error: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString()
      }));
    }
  }
  // Get latest analysis from database
  else if (req.url === '/analysis/latest' && req.method === 'GET') {
    try {
      const record = await database.getLatestAnalysis();
      
      if (!record) {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: false,
          message: 'No analysis found in database',
          timestamp: new Date().toISOString()
        }));
        return;
      }
      
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: true,
        analysis: record,
        timestamp: new Date().toISOString()
      }));
    } catch (error) {
      console.error('[API] Get latest analysis failed:', error);
      
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      }));
    }
  }
  // Get annotated chart file (if exists)
  else if (req.url === '/annotated-chart' && req.method === 'GET') {
    try {
      // Get the latest analysis from database to find the correct date
      const latestAnalysis = await database.getLatestAnalysis();
      
      if (!latestAnalysis || !latestAnalysis.asof_date) {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: false,
          message: 'No analysis found in database. Please run /analyze first.',
          timestamp: new Date().toISOString()
        }));
        return;
      }
      
      // Extract date from asof_date (convert Date object to YYYY-MM-DD)
      const asofDate = new Date(latestAnalysis.asof_date);
      const date = asofDate.toISOString().split('T')[0];
      const filePath = `${config.storage.dataDir}/${date}/annotated_chart.png`;
      
      if (!fs.existsSync(filePath)) {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: false,
          message: 'No annotated chart available for today. Please run /analyze first.',
          timestamp: new Date().toISOString()
        }));
        return;
      }
      
      const fileContent = fs.readFileSync(filePath);
      
      res.writeHead(200, {
        'Content-Type': 'image/png',
        'Content-Disposition': `inline; filename="annotated-chart-${date}.png"`,
        'Content-Length': fileContent.length
      });
      res.end(fileContent);
    } catch (error) {
      console.error('[API] Annotated-chart failed:', error);
      
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
      // Get the latest analysis from database to find the correct date
      const latestAnalysis = await database.getLatestAnalysis();
      
      if (!latestAnalysis || !latestAnalysis.asof_date) {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: false,
          message: 'No analysis found in database. Please run /analyze first.',
          timestamp: new Date().toISOString()
        }));
        return;
      }
      
      // Extract date from asof_date (convert Date object to YYYY-MM-DD)
      const asofDate = new Date(latestAnalysis.asof_date);
      const date = asofDate.toISOString().split('T')[0];
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
