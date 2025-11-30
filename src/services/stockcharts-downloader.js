import { chromium } from 'playwright';
import config from '../config.js';
import { ensureDateDir, saveFile } from '../utils/storage.js';
import sharp from 'sharp';

/**
 * Download StockCharts chart
 * @param {string} dateStr - Date string in YYYY-MM-DD format (defaults to today)
 * @returns {Promise<string>} - Path to saved chart file
 */
export async function downloadStockChart(dateStr) {
  let browser;
  let screenshot;
  const date = dateStr || new Date().toISOString().split('T')[0];

  try {

    console.log('[StockCharts] Starting chart download...');
    console.log('[StockCharts] Chart URL:', config.stockcharts.chartUrl);
    console.log('[StockCharts] Date:', date);

    // Launch browser
    console.log('[StockCharts] Launching browser...');
    browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const context = await browser.newContext({
      viewport: { width: 1920, height: 1080 }
    });

    const page = await context.newPage();

    // Navigate to chart
    console.log('[StockCharts] Navigating to chart...');
    await page.goto(config.stockcharts.chartUrl, {
      waitUntil: 'load',
      timeout: 60000
    });

    console.log('[StockCharts] Page loaded, waiting for chart to render...');

    // Wait for the main chart canvas to appear
    try {
      // Wait for any canvas element (chart is rendered on canvas)
      await page.waitForSelector('canvas', { timeout: 10000 });
      console.log('[StockCharts] Canvas element detected');
    } catch (error) {
      console.warn('[StockCharts] Canvas not found, continuing anyway...');
    }

    // Wait for chart to fully render
    console.log(`[StockCharts] Waiting ${config.stockcharts.waitTime}ms for chart to fully render...`);
    await page.waitForTimeout(config.stockcharts.waitTime);

    // Take full page screenshot
    console.log('[StockCharts] Taking full page screenshot...');
    screenshot = await page.screenshot({
      fullPage: false,
      type: 'png'
    });

    console.log(`[StockCharts] Screenshot captured (${screenshot.length} bytes)`);

  } catch (error) {
    console.error('[StockCharts] Error during download:', error);
    throw error;
  } finally {
    if (browser) {
      await browser.close();
      console.log('[StockCharts] Browser closed');
    }
  }

  // Crop the screenshot to remove header/footer
  try {
    console.log('[StockCharts] Cropping screenshot...');
    
    // Crop coordinates (adjust these based on the actual layout)
    // Top: Remove header and navigation (approx 180px - keep chart title)
    // Bottom: Remove settings panel (keep only chart, approx 520px height)
    // Left: Remove sidebar (approx 10px)
    // Right: Trim white space (chart ends around 1100px width)
    const croppedBuffer = await sharp(screenshot)
      .extract({
        left: 10,
        top: 145,  // Remove navigation but keep chart title and data
        width: 1100,  // Trim right white space
        height: 555  // Keep full chart with title and indicators
      })
      .toBuffer();

    console.log(`[StockCharts] Cropped screenshot (${croppedBuffer.length} bytes)`);
    screenshot = croppedBuffer;
  } catch (cropError) {
    console.warn('[StockCharts] Cropping failed, using full screenshot:', cropError.message);
    // Continue with uncropped screenshot
  }

  // Save to storage
  const filePath = await saveFile('original_chart.png', screenshot, date);

  console.log('[StockCharts] Chart downloaded successfully:', filePath);
  return filePath;
}
