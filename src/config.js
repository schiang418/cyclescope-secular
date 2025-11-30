import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

dotenv.config({ path: join(rootDir, '.env') });

/**
 * Application configuration
 */
export const config = {
  // TradingView
  tradingview: {
    chartUrl: process.env.TRADINGVIEW_CHART_URL || 'https://www.tradingview.com/chart/JUw67EaN/',
    username: process.env.TRADINGVIEW_USERNAME,
    password: process.env.TRADINGVIEW_PASSWORD,
    waitTime: 60000, // 60 seconds for chart to fully load
    viewport: {
      width: 1920,
      height: 1080
    }
  },

  // OpenAI
  openai: {
    apiKey: process.env.OPENAI_API_KEY,
    assistantId: process.env.OPENAI_ASSISTANT_ID || 'asst_Avw3WLDShSyQbeSQgscnuhqu',
    timeout: 120000, // 2 minutes
    pollingInterval: 2000 // 2 seconds
  },

  // Gemini
  gemini: {
    apiKey: process.env.GEMINI_API_KEY,
    timeout: 60000 // 1 minute
  },

  // Database
  database: {
    url: process.env.DATABASE_URL
  },

  // Storage
  storage: {
    dataDir: process.env.DATA_DIR || '/data',
    retentionDays: parseInt(process.env.RETENTION_DAYS || '30', 10)
  },

  // Server
  server: {
    port: parseInt(process.env.PORT || '3000', 10)
  }
};

/**
 * Validate required configuration
 */
export function validateConfig() {
  const errors = [];

  if (!config.tradingview.chartUrl) {
    errors.push('TRADINGVIEW_CHART_URL is required');
  }

  if (!config.openai.apiKey) {
    errors.push('OPENAI_API_KEY is required');
  }

  if (!config.openai.assistantId) {
    errors.push('OPENAI_ASSISTANT_ID is required');
  }

  if (!config.gemini.apiKey) {
    errors.push('GEMINI_API_KEY is required');
  }

  if (!config.database.url) {
    errors.push('DATABASE_URL is required');
  }

  if (errors.length > 0) {
    throw new Error(`Configuration errors:\n${errors.join('\n')}`);
  }

  return true;
}

export default config;
