/**
 * Database Migration: Change secular_trend from VARCHAR(100) to TEXT
 * 
 * Run this script once to update the existing database schema:
 * node migrate-secular-trend.mjs
 */

import pg from 'pg';
const { Pool } = pg;

async function migrate() {
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL environment variable is required');
    process.exit(1);
  }

  // Parse connection string to handle SSL
  const connectionConfig = {
    connectionString: process.env.DATABASE_URL
  };

  // Railway PostgreSQL requires SSL
  if (process.env.DATABASE_URL.includes('railway.app') || process.env.DATABASE_URL.includes('rlwy.net')) {
    connectionConfig.ssl = {
      rejectUnauthorized: false
    };
  }

  const pool = new Pool(connectionConfig);

  try {
    console.log('🔄 Starting migration...');
    console.log('📊 Changing secular_trend column from VARCHAR(100) to TEXT');

    // Alter column type
    const alterSQL = `
      ALTER TABLE secular_analysis 
      ALTER COLUMN secular_trend TYPE TEXT;
    `;

    await pool.query(alterSQL);

    console.log('✅ Migration completed successfully!');
    console.log('📝 secular_trend column is now TEXT (unlimited length)');

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error('Details:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

migrate();
