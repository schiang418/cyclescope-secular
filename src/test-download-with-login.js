#!/usr/bin/env node

/**
 * Test script for TradingView chart download with login
 */

import { downloadChartWithLoginAndRetry } from './services/tradingview-with-login.js';
import { getCurrentDate } from './utils/date.js';
import { validateConfig } from './config.js';

async function main() {
  console.log('='.repeat(80));
  console.log('CycleScope Secular - TradingView Download Test (With Login)');
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

    // Download chart with login
    console.log('[Test] Starting chart download with login...');
    const filePath = await downloadChartWithLoginAndRetry(date);
    
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
