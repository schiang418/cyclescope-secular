/**
 * Database Service - PostgreSQL with Granular Schema
 * 
 * Manages secular_analysis table with flattened columns for each JSON field.
 * See FIELD_MAPPING.md for complete column-to-JSON mapping.
 */

import pg from 'pg';
const { Pool } = pg;

class Database {
  constructor() {
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL environment variable is required');
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

    this.pool = new Pool(connectionConfig);

    console.log('[Database] Connection pool created');
  }

  /**
   * Initialize database schema
   * Creates secular_analysis table with 57 columns
   */
  async initialize() {
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS secular_analysis (
        -- Primary Key & Date
        id SERIAL PRIMARY KEY,
        asof_date DATE NOT NULL UNIQUE,
        
        -- Layer 1: Core Analysis Fields (7 columns)
        secular_trend VARCHAR(100),
        secular_regime_status VARCHAR(100),
        channel_position VARCHAR(100),
        recent_behavior_summary TEXT,
        interpretation TEXT,
        risk_bias TEXT,
        summary_signal TEXT,
        
        -- Layer 2: Scenario Analysis Metadata (3 columns)
        dominant_dynamics TEXT,
        overall_bias TEXT,
        secular_summary TEXT,
        
        -- Layer 2: Scenario 1 (9 columns)
        scenario1_id VARCHAR(10),
        scenario1_name VARCHAR(100),
        scenario1_probability DECIMAL(5,4),
        scenario1_path_summary TEXT,
        scenario1_technical_logic TEXT,
        scenario1_target_zone TEXT,
        scenario1_expected_move_min DECIMAL(6,2),
        scenario1_expected_move_max DECIMAL(6,2),
        scenario1_risk_profile TEXT,
        
        -- Layer 2: Scenario 2 (9 columns)
        scenario2_id VARCHAR(10),
        scenario2_name VARCHAR(100),
        scenario2_probability DECIMAL(5,4),
        scenario2_path_summary TEXT,
        scenario2_technical_logic TEXT,
        scenario2_target_zone TEXT,
        scenario2_expected_move_min DECIMAL(6,2),
        scenario2_expected_move_max DECIMAL(6,2),
        scenario2_risk_profile TEXT,
        
        -- Layer 2: Scenario 3 (9 columns)
        scenario3_id VARCHAR(10),
        scenario3_name VARCHAR(100),
        scenario3_probability DECIMAL(5,4),
        scenario3_path_summary TEXT,
        scenario3_technical_logic TEXT,
        scenario3_target_zone TEXT,
        scenario3_expected_move_min DECIMAL(6,2),
        scenario3_expected_move_max DECIMAL(6,2),
        scenario3_risk_profile TEXT,
        
        -- Layer 2: Scenario 4 (9 columns)
        scenario4_id VARCHAR(10),
        scenario4_name VARCHAR(100),
        scenario4_probability DECIMAL(5,4),
        scenario4_path_summary TEXT,
        scenario4_technical_logic TEXT,
        scenario4_target_zone TEXT,
        scenario4_expected_move_min DECIMAL(6,2),
        scenario4_expected_move_max DECIMAL(6,2),
        scenario4_risk_profile TEXT,
        
        -- Layer 3: Summary Fields (5 columns)
        scenario_summary_1 TEXT,
        scenario_summary_2 TEXT,
        scenario_summary_3 TEXT,
        scenario_summary_4 TEXT,
        primary_message TEXT,
        
        -- File References (2 columns)
        original_chart_url TEXT,
        annotated_chart_url TEXT,
        
        -- Timestamps (2 columns)
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_secular_analysis_asof_date 
      ON secular_analysis(asof_date DESC);
    `;

    try {
      await this.pool.query(createTableSQL);
      console.log('[Database] Schema initialized successfully');
    } catch (error) {
      console.error('[Database] Schema initialization failed:', error);
      throw error;
    }
  }

  /**
   * Map JSON analysis to database row
   * @param {Object} analysis - Analysis object with layer1, layer2, layer3
   * @returns {Object} Mapped row data
   */
  mapAnalysisToRow(analysis) {
    const { layer1, layer2, layer3, original_chart_url, annotated_chart_url } = analysis;
    
    // Extract scenarios array
    const scenarios = layer2?.scenario_analysis?.scenarios || [];
    
    // Helper to safely get scenario field
    const getScenario = (index, field, subfield = null) => {
      const scenario = scenarios[index];
      if (!scenario) return null;
      if (subfield) return scenario[field]?.[subfield];
      return scenario[field];
    };

    return {
      // Core
      asof_date: layer1?.asof_date,
      
      // Layer 1 (7 fields)
      secular_trend: layer1?.secular_trend,
      secular_regime_status: layer1?.secular_regime_status,
      channel_position: layer1?.channel_position,
      recent_behavior_summary: layer1?.recent_behavior_summary,
      interpretation: layer1?.interpretation,
      risk_bias: layer1?.risk_bias,
      summary_signal: layer1?.summary_signal,
      
      // Layer 2 Metadata (3 fields)
      dominant_dynamics: layer2?.scenario_analysis?.dominant_dynamics,
      overall_bias: layer2?.scenario_analysis?.overall_bias,
      secular_summary: layer2?.scenario_analysis?.secular_summary,
      
      // Scenario 1 (9 fields)
      scenario1_id: getScenario(0, 'scenario_id'),
      scenario1_name: getScenario(0, 'name'),
      scenario1_probability: getScenario(0, 'probability'),
      scenario1_path_summary: getScenario(0, 'path_summary'),
      scenario1_technical_logic: getScenario(0, 'technical_logic'),
      scenario1_target_zone: getScenario(0, 'target_zone_description'),
      scenario1_expected_move_min: getScenario(0, 'expected_move_percent', 0),
      scenario1_expected_move_max: getScenario(0, 'expected_move_percent', 1),
      scenario1_risk_profile: getScenario(0, 'risk_profile'),
      
      // Scenario 2 (9 fields)
      scenario2_id: getScenario(1, 'scenario_id'),
      scenario2_name: getScenario(1, 'name'),
      scenario2_probability: getScenario(1, 'probability'),
      scenario2_path_summary: getScenario(1, 'path_summary'),
      scenario2_technical_logic: getScenario(1, 'technical_logic'),
      scenario2_target_zone: getScenario(1, 'target_zone_description'),
      scenario2_expected_move_min: getScenario(1, 'expected_move_percent', 0),
      scenario2_expected_move_max: getScenario(1, 'expected_move_percent', 1),
      scenario2_risk_profile: getScenario(1, 'risk_profile'),
      
      // Scenario 3 (9 fields)
      scenario3_id: getScenario(2, 'scenario_id'),
      scenario3_name: getScenario(2, 'name'),
      scenario3_probability: getScenario(2, 'probability'),
      scenario3_path_summary: getScenario(2, 'path_summary'),
      scenario3_technical_logic: getScenario(2, 'technical_logic'),
      scenario3_target_zone: getScenario(2, 'target_zone_description'),
      scenario3_expected_move_min: getScenario(2, 'expected_move_percent', 0),
      scenario3_expected_move_max: getScenario(2, 'expected_move_percent', 1),
      scenario3_risk_profile: getScenario(2, 'risk_profile'),
      
      // Scenario 4 (9 fields)
      scenario4_id: getScenario(3, 'scenario_id'),
      scenario4_name: getScenario(3, 'name'),
      scenario4_probability: getScenario(3, 'probability'),
      scenario4_path_summary: getScenario(3, 'path_summary'),
      scenario4_technical_logic: getScenario(3, 'technical_logic'),
      scenario4_target_zone: getScenario(3, 'target_zone_description'),
      scenario4_expected_move_min: getScenario(3, 'expected_move_percent', 0),
      scenario4_expected_move_max: getScenario(3, 'expected_move_percent', 1),
      scenario4_risk_profile: getScenario(3, 'risk_profile'),
      
      // Layer 3 (5 fields)
      scenario_summary_1: layer3?.scenario_summary?.[0],
      scenario_summary_2: layer3?.scenario_summary?.[1],
      scenario_summary_3: layer3?.scenario_summary?.[2],
      scenario_summary_4: layer3?.scenario_summary?.[3],
      primary_message: layer3?.primary_message,
      
      // File references
      original_chart_url: original_chart_url || null,
      annotated_chart_url: annotated_chart_url || null
    };
  }

  /**
   * Save or update analysis (upsert)
   * @param {Object} analysis - Analysis object with layer1, layer2, layer3
   * @returns {Object} Saved record
   */
  async saveAnalysis(analysis) {
    const row = this.mapAnalysisToRow(analysis);
    
    const upsertSQL = `
      INSERT INTO secular_analysis (
        asof_date,
        secular_trend, secular_regime_status, channel_position,
        recent_behavior_summary, interpretation, risk_bias, summary_signal,
        dominant_dynamics, overall_bias, secular_summary,
        scenario1_id, scenario1_name, scenario1_probability, scenario1_path_summary,
        scenario1_technical_logic, scenario1_target_zone, scenario1_expected_move_min,
        scenario1_expected_move_max, scenario1_risk_profile,
        scenario2_id, scenario2_name, scenario2_probability, scenario2_path_summary,
        scenario2_technical_logic, scenario2_target_zone, scenario2_expected_move_min,
        scenario2_expected_move_max, scenario2_risk_profile,
        scenario3_id, scenario3_name, scenario3_probability, scenario3_path_summary,
        scenario3_technical_logic, scenario3_target_zone, scenario3_expected_move_min,
        scenario3_expected_move_max, scenario3_risk_profile,
        scenario4_id, scenario4_name, scenario4_probability, scenario4_path_summary,
        scenario4_technical_logic, scenario4_target_zone, scenario4_expected_move_min,
        scenario4_expected_move_max, scenario4_risk_profile,
        scenario_summary_1, scenario_summary_2, scenario_summary_3, scenario_summary_4,
        primary_message,
        original_chart_url, annotated_chart_url
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11,
        $12, $13, $14, $15, $16, $17, $18, $19, $20,
        $21, $22, $23, $24, $25, $26, $27, $28, $29,
        $30, $31, $32, $33, $34, $35, $36, $37, $38,
        $39, $40, $41, $42, $43, $44, $45, $46, $47,
        $48, $49, $50, $51, $52, $53, $54
      )
      ON CONFLICT (asof_date) DO UPDATE SET
        secular_trend = EXCLUDED.secular_trend,
        secular_regime_status = EXCLUDED.secular_regime_status,
        channel_position = EXCLUDED.channel_position,
        recent_behavior_summary = EXCLUDED.recent_behavior_summary,
        interpretation = EXCLUDED.interpretation,
        risk_bias = EXCLUDED.risk_bias,
        summary_signal = EXCLUDED.summary_signal,
        dominant_dynamics = EXCLUDED.dominant_dynamics,
        overall_bias = EXCLUDED.overall_bias,
        secular_summary = EXCLUDED.secular_summary,
        scenario1_id = EXCLUDED.scenario1_id,
        scenario1_name = EXCLUDED.scenario1_name,
        scenario1_probability = EXCLUDED.scenario1_probability,
        scenario1_path_summary = EXCLUDED.scenario1_path_summary,
        scenario1_technical_logic = EXCLUDED.scenario1_technical_logic,
        scenario1_target_zone = EXCLUDED.scenario1_target_zone,
        scenario1_expected_move_min = EXCLUDED.scenario1_expected_move_min,
        scenario1_expected_move_max = EXCLUDED.scenario1_expected_move_max,
        scenario1_risk_profile = EXCLUDED.scenario1_risk_profile,
        scenario2_id = EXCLUDED.scenario2_id,
        scenario2_name = EXCLUDED.scenario2_name,
        scenario2_probability = EXCLUDED.scenario2_probability,
        scenario2_path_summary = EXCLUDED.scenario2_path_summary,
        scenario2_technical_logic = EXCLUDED.scenario2_technical_logic,
        scenario2_target_zone = EXCLUDED.scenario2_target_zone,
        scenario2_expected_move_min = EXCLUDED.scenario2_expected_move_min,
        scenario2_expected_move_max = EXCLUDED.scenario2_expected_move_max,
        scenario2_risk_profile = EXCLUDED.scenario2_risk_profile,
        scenario3_id = EXCLUDED.scenario3_id,
        scenario3_name = EXCLUDED.scenario3_name,
        scenario3_probability = EXCLUDED.scenario3_probability,
        scenario3_path_summary = EXCLUDED.scenario3_path_summary,
        scenario3_technical_logic = EXCLUDED.scenario3_technical_logic,
        scenario3_target_zone = EXCLUDED.scenario3_target_zone,
        scenario3_expected_move_min = EXCLUDED.scenario3_expected_move_min,
        scenario3_expected_move_max = EXCLUDED.scenario3_expected_move_max,
        scenario3_risk_profile = EXCLUDED.scenario3_risk_profile,
        scenario4_id = EXCLUDED.scenario4_id,
        scenario4_name = EXCLUDED.scenario4_name,
        scenario4_probability = EXCLUDED.scenario4_probability,
        scenario4_path_summary = EXCLUDED.scenario4_path_summary,
        scenario4_technical_logic = EXCLUDED.scenario4_technical_logic,
        scenario4_target_zone = EXCLUDED.scenario4_target_zone,
        scenario4_expected_move_min = EXCLUDED.scenario4_expected_move_min,
        scenario4_expected_move_max = EXCLUDED.scenario4_expected_move_max,
        scenario4_risk_profile = EXCLUDED.scenario4_risk_profile,
        scenario_summary_1 = EXCLUDED.scenario_summary_1,
        scenario_summary_2 = EXCLUDED.scenario_summary_2,
        scenario_summary_3 = EXCLUDED.scenario_summary_3,
        scenario_summary_4 = EXCLUDED.scenario_summary_4,
        primary_message = EXCLUDED.primary_message,
        original_chart_url = EXCLUDED.original_chart_url,
        annotated_chart_url = EXCLUDED.annotated_chart_url,
        updated_at = CURRENT_TIMESTAMP
      RETURNING *;
    `;

    const values = [
      row.asof_date,
      row.secular_trend, row.secular_regime_status, row.channel_position,
      row.recent_behavior_summary, row.interpretation, row.risk_bias, row.summary_signal,
      row.dominant_dynamics, row.overall_bias, row.secular_summary,
      row.scenario1_id, row.scenario1_name, row.scenario1_probability, row.scenario1_path_summary,
      row.scenario1_technical_logic, row.scenario1_target_zone, row.scenario1_expected_move_min,
      row.scenario1_expected_move_max, row.scenario1_risk_profile,
      row.scenario2_id, row.scenario2_name, row.scenario2_probability, row.scenario2_path_summary,
      row.scenario2_technical_logic, row.scenario2_target_zone, row.scenario2_expected_move_min,
      row.scenario2_expected_move_max, row.scenario2_risk_profile,
      row.scenario3_id, row.scenario3_name, row.scenario3_probability, row.scenario3_path_summary,
      row.scenario3_technical_logic, row.scenario3_target_zone, row.scenario3_expected_move_min,
      row.scenario3_expected_move_max, row.scenario3_risk_profile,
      row.scenario4_id, row.scenario4_name, row.scenario4_probability, row.scenario4_path_summary,
      row.scenario4_technical_logic, row.scenario4_target_zone, row.scenario4_expected_move_min,
      row.scenario4_expected_move_max, row.scenario4_risk_profile,
      row.scenario_summary_1, row.scenario_summary_2, row.scenario_summary_3, row.scenario_summary_4,
      row.primary_message,
      row.original_chart_url, row.annotated_chart_url
    ];

    try {
      const result = await this.pool.query(upsertSQL, values);
      console.log(`[Database] Analysis saved for ${row.asof_date} (ID: ${result.rows[0].id})`);
      return result.rows[0];
    } catch (error) {
      console.error('[Database] Save failed:', error);
      throw error;
    }
  }

  /**
   * Get latest analysis
   * @returns {Object|null} Latest analysis record
   */
  async getLatestAnalysis() {
    const sql = `
      SELECT * FROM secular_analysis 
      ORDER BY asof_date DESC 
      LIMIT 1;
    `;

    try {
      const result = await this.pool.query(sql);
      return result.rows[0] || null;
    } catch (error) {
      console.error('[Database] Get latest analysis failed:', error);
      throw error;
    }
  }

  /**
   * Get analysis by date
   * @param {string} date - Date in YYYY-MM-DD format
   * @returns {Object|null} Analysis record
   */
  async getAnalysisByDate(date) {
    const sql = `
      SELECT * FROM secular_analysis 
      WHERE asof_date = $1;
    `;

    try {
      const result = await this.pool.query(sql, [date]);
      return result.rows[0] || null;
    } catch (error) {
      console.error('[Database] Get analysis by date failed:', error);
      throw error;
    }
  }

  /**
   * Test database connection
   * @returns {boolean} Connection status
   */
  async testConnection() {
    console.log('[Database] Testing connection...');
    try {
      const result = await this.pool.query('SELECT NOW()');
      console.log('[Database] Connection successful:', result.rows[0].now);
      return true;
    } catch (error) {
      console.error('[Database] Connection failed:', error);
      return false;
    }
  }

  /**
   * Close database connection
   */
  async close() {
    await this.pool.end();
    console.log('[Database] Connection pool closed');
  }
}

// Export singleton instance
export const database = new Database();
