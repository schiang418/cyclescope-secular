#!/usr/bin/env node

/**
 * Test TradingView login only
 * This script tests if we can successfully login to TradingView
 * and verify the login status
 */

import { chromium } from '@playwright/test';

const TRADINGVIEW_USERNAME = 'hyc_76@yahoo.com';
const TRADINGVIEW_PASSWORD = 'Avo1chi418!123';

async function testLogin() {
  console.log('=== TradingView Login Test ===\n');
  console.log(`Username: ${TRADINGVIEW_USERNAME}`);
  console.log(`Password: ${'*'.repeat(TRADINGVIEW_PASSWORD.length)}\n`);

  let browser;

  try {
    // Launch browser
    console.log('[1/8] Launching browser...');
    browser = await chromium.launch({
      headless: true, // Must be true in sandbox environment
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const context = await browser.newContext({
      viewport: { width: 1920, height: 1080 }
    });

    const page = await context.newPage();

    // Navigate to TradingView
    console.log('[2/8] Navigating to TradingView...');
    await page.goto('https://www.tradingview.com/', {
      waitUntil: 'load',
      timeout: 60000
    });
    console.log('✓ Page loaded');

    // Click user menu
    console.log('[3/8] Opening user menu...');
    await page.click('button[aria-label="Open user menu"]', { timeout: 10000 });
    await page.waitForTimeout(1000);
    console.log('✓ User menu opened');

    // Click Sign in
    console.log('[4/8] Clicking Sign in...');
    await page.click('button:has-text("Sign in")', { timeout: 5000 });
    await page.waitForTimeout(2000);
    console.log('✓ Sign in dialog opened');

    // Click Email option
    console.log('[5/8] Selecting Email login method...');
    await page.click('button:has-text("Email")', { timeout: 5000 });
    await page.waitForTimeout(2000);
    console.log('✓ Email login selected');

    // Fill credentials
    console.log('[6/8] Entering credentials...');
    await page.waitForSelector('input#id_username', { timeout: 10000 });
    await page.fill('input#id_username', TRADINGVIEW_USERNAME);
    await page.waitForTimeout(500);
    await page.fill('input#id_password', TRADINGVIEW_PASSWORD);
    await page.waitForTimeout(500);
    console.log('✓ Credentials entered');

    // Submit login
    console.log('[7/8] Submitting login form...');
    await page.click('button:has-text("Sign in")', { timeout: 5000 });
    console.log('✓ Login form submitted');

    // Wait for login to complete
    console.log('[8/8] Waiting for login to complete...');
    await page.waitForTimeout(5000);

    // Check if login was successful
    console.log('\n=== Verifying Login Status ===\n');

    // Method 1: Check if user menu is visible
    try {
      await page.waitForSelector('button[aria-label="Open user menu"]', {
        timeout: 5000,
        state: 'visible'
      });
      console.log('✓ User menu is visible (login likely successful)');
    } catch (error) {
      console.log('✗ User menu not found (login may have failed)');
    }

    // Method 2: Check if we can see the user profile
    try {
      await page.click('button[aria-label="Open user menu"]', { timeout: 5000 });
      await page.waitForTimeout(1000);
      
      // Look for user email or profile info
      const pageContent = await page.content();
      if (pageContent.includes(TRADINGVIEW_USERNAME) || pageContent.includes('hyc_76')) {
        console.log('✓ User email found in profile menu (login confirmed)');
      } else {
        console.log('? User email not found in profile menu');
      }
    } catch (error) {
      console.log('✗ Could not verify user profile:', error.message);
    }

    // Method 3: Take a screenshot for manual verification
    console.log('\n=== Taking Screenshot ===\n');
    const screenshot = await page.screenshot({
      fullPage: false,
      type: 'png'
    });
    
    const fs = await import('fs');
    const screenshotPath = '/tmp/tradingview-login-test.png';
    fs.writeFileSync(screenshotPath, screenshot);
    console.log(`✓ Screenshot saved to: ${screenshotPath}`);
    console.log(`  Screenshot size: ${(screenshot.length / 1024).toFixed(2)} KB`);

    // Method 4: Check current URL
    const currentUrl = page.url();
    console.log(`\nCurrent URL: ${currentUrl}`);
    
    if (currentUrl.includes('tradingview.com') && !currentUrl.includes('signin')) {
      console.log('✓ Not on signin page (login likely successful)');
    } else {
      console.log('✗ Still on signin page (login may have failed)');
    }

    console.log('\n=== Test Complete ===\n');
    console.log('Please check the screenshot to verify login status.');
    console.log('Browser will stay open for 10 seconds for manual inspection...\n');
    
    await page.waitForTimeout(10000);

  } catch (error) {
    console.error('\n❌ Error during login test:', error.message);
    console.error('\nFull error:', error);
  } finally {
    if (browser) {
      await browser.close();
      console.log('Browser closed');
    }
  }
}

testLogin();
