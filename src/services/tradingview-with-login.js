import { chromium } from '@playwright/test';
import { config } from '../config.js';
import { saveFile } from '../utils/storage.js';
import { getCurrentDate } from '../utils/date.js';

/**
 * TradingView chart downloader with login
 * Required for accessing private charts and custom indicators
 */

/**
 * Login to TradingView
 * @param {import('@playwright/test').Page} page - Playwright page object
 * @returns {Promise<void>}
 */
async function loginToTradingView(page) {
  console.log('[TradingView] Logging in...');
  
  // Navigate to login page
  await page.goto('https://www.tradingview.com/', {
    waitUntil: 'load',
    timeout: 60000
  });
  
  console.log('[TradingView] Looking for user menu...');
  
  // Click user menu button
  try {
    await page.click('button[aria-label="Open user menu"]', { timeout: 10000 });
    console.log('[TradingView] Opened user menu');
    await page.waitForTimeout(1000);
  } catch (error) {
    console.error('[TradingView] Error opening user menu:', error.message);
    throw new Error('Could not open user menu');
  }
  
  // Click "Sign in" button
  try {
    await page.click('button:has-text("Sign in")', { timeout: 5000 });
    console.log('[TradingView] Clicked Sign in button');
    await page.waitForTimeout(2000);
  } catch (error) {
    console.error('[TradingView] Error clicking Sign in:', error.message);
    throw new Error('Could not click Sign in button');
  }
  
  // Click "Email" option
  try {
    await page.click('button:has-text("Email")', { timeout: 5000 });
    console.log('[TradingView] Clicked Email option');
    await page.waitForTimeout(2000);
  } catch (error) {
    console.error('[TradingView] Error clicking Email option:', error.message);
    throw new Error('Could not click Email option');
  }
  
  console.log('[TradingView] Entering credentials...');
  
  // Wait for login form
  try {
    await page.waitForSelector('input#id_username', { timeout: 10000 });
  } catch (error) {
    console.error('[TradingView] Login form not found');
    throw new Error('Login form not found');
  }
  
  // Fill in username/email
  await page.fill('input#id_username', config.tradingview.username);
  await page.waitForTimeout(500);
  
  // Fill in password
  await page.fill('input#id_password', config.tradingview.password);
  await page.waitForTimeout(500);
  
  console.log('[TradingView] Submitting login form...');
  
  // Click submit button
  try {
    await page.click('button:has-text("Sign in")', { timeout: 5000 });
    console.log('[TradingView] Clicked Sign in submit button');
  } catch (error) {
    console.error('[TradingView] Error submitting login:', error.message);
    throw new Error('Could not submit login form');
  }
  
  // Wait for login to complete
  console.log('[TradingView] Waiting for login to complete...');
  await page.waitForTimeout(5000);
  
  // Check if login was successful by checking if we're redirected or dialog closed
  try {
    // Wait for the login dialog to disappear
    await page.waitForSelector('button[aria-label="Open user menu"]', {
      timeout: 10000,
      state: 'visible'
    });
    console.log('[TradingView] Login successful ✓');
  } catch (error) {
    console.warn('[TradingView] Could not verify login success, continuing anyway...');
  }
}

/**
 * Download TradingView chart screenshot with login
 * @param {string} [date] - Date in YYYY-MM-DD format, defaults to current date
 * @returns {Promise<string>} Path to saved screenshot
 */
export async function downloadChartWithLogin(date = getCurrentDate()) {
  console.log('[TradingView] Starting chart download with login...');
  console.log(`[TradingView] Chart URL: ${config.tradingview.chartUrl}`);
  console.log(`[TradingView] Date: ${date}`);

  if (!config.tradingview.username || !config.tradingview.password) {
    throw new Error('TradingView credentials not configured. Set TRADINGVIEW_USERNAME and TRADINGVIEW_PASSWORD in .env');
  }

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

    // Login first
    await loginToTradingView(page);

    // Navigate to chart
    console.log('[TradingView] Navigating to chart...');
    await page.goto(config.tradingview.chartUrl, {
      waitUntil: 'load',
      timeout: 90000
    });

    console.log('[TradingView] Page loaded, waiting for chart to render...');

    // Wait for chart to load
    try {
      await page.waitForSelector('canvas', { timeout: 10000 });
      console.log('[TradingView] Chart canvas detected');
    } catch (error) {
      console.warn('[TradingView] Canvas not detected, continuing anyway...');
    }

    // Close any popups/dialogs (including subscription prompts)
    console.log('[TradingView] Attempting to close popups...');
    
    for (let attempt = 1; attempt <= 5; attempt++) {
      try {
        const closeSelectors = [
          'button:has-text("Don\'t need")',  // Subscription popup
          'button:has-text("No thanks")',     // Other prompts
          'button:has-text("Maybe later")',   // Delayed prompts
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
              await page.waitForTimeout(1500);
            } catch (err) {
              // Button not clickable, skip
            }
          }
        }
        
        if (!closedAny && attempt === 1) {
          console.log('[TradingView] No popups detected on first attempt');
        }
        
        await page.waitForTimeout(2000);
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
export async function downloadChartWithLoginAndRetry(date = getCurrentDate(), maxRetries = 3) {
  let lastError;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`[TradingView] Download attempt ${attempt}/${maxRetries}`);
      return await downloadChartWithLogin(date);
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
  downloadChartWithLogin,
  downloadChartWithLoginAndRetry
};
