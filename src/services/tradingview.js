import { chromium } from '@playwright/test';
import { config } from '../config.js';
import { saveFile } from '../utils/storage.js';
import { getCurrentDate } from '../utils/date.js';

/**
 * TradingView chart downloader using Playwright
 * Simplified approach using public share link (no login required)
 */

/**
 * Download TradingView chart screenshot
 * @param {string} [date] - Date in YYYY-MM-DD format, defaults to current date
 * @returns {Promise<string>} Path to saved screenshot
 */
export async function downloadChart(date = getCurrentDate()) {
  console.log('[TradingView] Starting chart download...');
  console.log(`[TradingView] Chart URL: ${config.tradingview.chartUrl}`);
  console.log(`[TradingView] Date: ${date}`);

  let browser;
  let screenshot;

  try {
    // Launch browser
    console.log('[TradingView] Launching browser...');
    browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const context = await browser.newContext({
      viewport: config.tradingview.viewport
    });

    const page = await context.newPage();

    // Navigate to chart
    console.log('[TradingView] Navigating to chart...');
    await page.goto(config.tradingview.chartUrl, {
      waitUntil: 'load',
      timeout: 90000
    });

    console.log('[TradingView] Page loaded, waiting for chart to render...');

    // Wait for chart to load
    // TradingView charts typically have a canvas element
    try {
      await page.waitForSelector('canvas', { timeout: 10000 });
      console.log('[TradingView] Chart canvas detected');
    } catch (error) {
      console.warn('[TradingView] Canvas not detected, continuing anyway...');
    }

    // Close any popups/dialogs (try multiple times)
    console.log('[TradingView] Attempting to close popups...');
    
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        // Look for common close buttons
        const closeSelectors = [
          'button[aria-label="Close"]',
          'button[data-name="close"]',
          '.tv-dialog__close',
          '[data-role="button"][aria-label="Close"]',
          'button:has-text("×")',
          'button.close',
          '[class*="close"]'
        ];

        let closedAny = false;
        for (const selector of closeSelectors) {
          const closeButtons = await page.$$(selector);
          for (const button of closeButtons) {
            try {
              await button.click({ timeout: 2000 });
              console.log(`[TradingView] Closed popup using selector: ${selector}`);
              closedAny = true;
              await page.waitForTimeout(1000);
            } catch (err) {
              // Button not clickable, skip
            }
          }
        }
        
        if (!closedAny && attempt === 1) {
          console.log('[TradingView] No popups detected on first attempt');
        }
        
        await page.waitForTimeout(1000);
      } catch (error) {
        console.log(`[TradingView] Popup close attempt ${attempt} error:`, error.message);
      }
    }
    
    console.log('[TradingView] Popup handling complete');

    // Wait for chart to fully render
    console.log(`[TradingView] Waiting ${config.tradingview.waitTime}ms for chart to fully render...`);
    await page.waitForTimeout(config.tradingview.waitTime);
    
    // Final popup check before screenshot
    console.log('[TradingView] Final popup check before screenshot...');
    try {
      const closeButtons = await page.$$('button[aria-label="Close"]');
      for (const button of closeButtons) {
        try {
          await button.click({ timeout: 1000 });
          console.log('[TradingView] Closed final popup');
          await page.waitForTimeout(500);
        } catch {}
      }
    } catch {}

    // Take screenshot
    console.log('[TradingView] Taking screenshot...');
    screenshot = await page.screenshot({
      fullPage: false,
      type: 'png'
    });

    console.log(`[TradingView] Screenshot captured (${screenshot.length} bytes)`);

  } catch (error) {
    console.error('[TradingView] Error during download:', error);
    throw error;
  } finally {
    if (browser) {
      await browser.close();
      console.log('[TradingView] Browser closed');
    }
  }

  // Save screenshot
  const filename = 'original_chart.png';
  const filePath = await saveFile(filename, screenshot, date);

  console.log(`[TradingView] Chart downloaded successfully: ${filePath}`);
  return filePath;
}

/**
 * Download chart with retry logic
 * @param {string} [date] - Date in YYYY-MM-DD format, defaults to current date
 * @param {number} [maxRetries=3] - Maximum number of retry attempts
 * @returns {Promise<string>} Path to saved screenshot
 */
export async function downloadChartWithRetry(date = getCurrentDate(), maxRetries = 3) {
  let lastError;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`[TradingView] Download attempt ${attempt}/${maxRetries}`);
      return await downloadChart(date);
    } catch (error) {
      lastError = error;
      console.error(`[TradingView] Attempt ${attempt} failed:`, error.message);

      if (attempt < maxRetries) {
        const waitTime = attempt * 5000; // Exponential backoff: 5s, 10s, 15s
        console.log(`[TradingView] Retrying in ${waitTime}ms...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
  }

  throw new Error(`Failed to download chart after ${maxRetries} attempts: ${lastError.message}`);
}

export default {
  downloadChart,
  downloadChartWithRetry
};
