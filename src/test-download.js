#!/usr/bin/env node

/**
 * Test script for TradingView chart download
 */

import { downloadChartWithRetry } from './services/tradingview.js';
import { getCurrentDate } from './utils/date.js';
import { validateConfig } from './config.js';

async function main() {
  console.log('='.repeat(80));
  console.log('CycleScope Secular - TradingView Download Test');
  console.log('='.repeat(80));
  console.log('');

  try {
    // Validate configuration
    console.log('[Test] Validating configuration...');
    validateConfig();
    console.log('[Test] Configuration valid ✓');
    console.log('');

    // Get current date
    const date = getCurrentDate();
    console.log(`[Test] Current date: ${date}`);
    console.log('');

    // Download chart
    console.log('[Test] Starting chart download...');
    const filePath = await downloadChartWithRetry(date);
    
    console.log('');
    console.log('='.repeat(80));
    console.log('✅ TEST PASSED');
    console.log('='.repeat(80));
    console.log(`Chart saved to: ${filePath}`);
    console.log('');

  } catch (error) {
    console.error('');
    console.error('='.repeat(80));
    console.error('❌ TEST FAILED');
    console.error('='.repeat(80));
    console.error(`Error: ${error.message}`);
    console.error('');
    console.error('Stack trace:');
    console.error(error.stack);
    console.error('');
    process.exit(1);
  }
}

main();
