# CycleScope Secular - Database Schema (Granular Fields)

This document describes the **granular** PostgreSQL database schema where each JSON field has its own database column.

---

## Database Schema

```sql
CREATE TABLE IF NOT EXISTS secular_analysis (
  -- Primary Key & Date
  id SERIAL PRIMARY KEY,
  asof_date DATE NOT NULL UNIQUE,
  
  -- Layer 1: Core Analysis Fields
  secular_trend VARCHAR(100),
  secular_regime_status VARCHAR(100),
  channel_position VARCHAR(100),
  recent_behavior_summary TEXT,
  interpretation TEXT,
  risk_bias TEXT,
  summary_signal TEXT,
  
  -- Layer 2: Scenario Analysis Metadata
  dominant_dynamics TEXT,
  overall_bias TEXT,
  secular_summary TEXT,
  
  -- Layer 2: Scenario 1 (Highest Probability)
  scenario1_id VARCHAR(10),
  scenario1_name VARCHAR(100),
  scenario1_probability DECIMAL(5,4),
  scenario1_path_summary TEXT,
  scenario1_technical_logic TEXT,
  scenario1_target_zone TEXT,
  scenario1_expected_move_min DECIMAL(6,2),
  scenario1_expected_move_max DECIMAL(6,2),
  scenario1_risk_profile TEXT,
  
  -- Layer 2: Scenario 2
  scenario2_id VARCHAR(10),
  scenario2_name VARCHAR(100),
  scenario2_probability DECIMAL(5,4),
  scenario2_path_summary TEXT,
  scenario2_technical_logic TEXT,
  scenario2_target_zone TEXT,
  scenario2_expected_move_min DECIMAL(6,2),
  scenario2_expected_move_max DECIMAL(6,2),
  scenario2_risk_profile TEXT,
  
  -- Layer 2: Scenario 3
  scenario3_id VARCHAR(10),
  scenario3_name VARCHAR(100),
  scenario3_probability DECIMAL(5,4),
  scenario3_path_summary TEXT,
  scenario3_technical_logic TEXT,
  scenario3_target_zone TEXT,
  scenario3_expected_move_min DECIMAL(6,2),
  scenario3_expected_move_max DECIMAL(6,2),
  scenario3_risk_profile TEXT,
  
  -- Layer 2: Scenario 4
  scenario4_id VARCHAR(10),
  scenario4_name VARCHAR(100),
  scenario4_probability DECIMAL(5,4),
  scenario4_path_summary TEXT,
  scenario4_technical_logic TEXT,
  scenario4_target_zone TEXT,
  scenario4_expected_move_min DECIMAL(6,2),
  scenario4_expected_move_max DECIMAL(6,2),
  scenario4_risk_profile TEXT,
  
  -- Layer 3: Summary Fields
  scenario_summary_1 TEXT,
  scenario_summary_2 TEXT,
  scenario_summary_3 TEXT,
  scenario_summary_4 TEXT,
  primary_message TEXT,
  
  -- File References
  original_chart_url TEXT,
  annotated_chart_url TEXT,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index on asof_date for fast lookups
CREATE INDEX IF NOT EXISTS idx_secular_analysis_asof_date ON secular_analysis(asof_date DESC);
```

---

## Field Mapping

### Core Fields

| Database Column | JSON Source | Type | Description |
|----------------|-------------|------|-------------|
| `id` | Auto-generated | SERIAL | Primary key |
| `asof_date` | `layer1.asof_date` | DATE | Analysis date (UNIQUE) |

---

### Layer 1 Fields

| Database Column | JSON Source | Type | Example Value |
|----------------|-------------|------|---------------|
| `secular_trend` | `layer1.secular_trend` | VARCHAR(100) | "Secular Bull" |
| `secular_regime_status` | `layer1.secular_regime_status` | VARCHAR(100) | "Active Secular Bull" |
| `channel_position` | `layer1.channel_position` | VARCHAR(100) | "below_upper_band_no_overshoot" |
| `recent_behavior_summary` | `layer1.recent_behavior_summary` | TEXT | "The SPX is currently..." |
| `interpretation` | `layer1.interpretation` | TEXT | "The market is in a mature phase..." |
| `risk_bias` | `layer1.risk_bias` | TEXT | "Moderate risk of correction..." |
| `summary_signal` | `layer1.summary_signal` | TEXT | "Cautiously bullish..." |

---

### Layer 2 Metadata Fields

| Database Column | JSON Source | Type | Example Value |
|----------------|-------------|------|---------------|
| `dominant_dynamics` | `layer2.scenario_analysis.dominant_dynamics` | TEXT | "The market is navigating..." |
| `overall_bias` | `layer2.scenario_analysis.overall_bias` | TEXT | "Cautiously optimistic..." |
| `secular_summary` | `layer2.scenario_analysis.secular_summary` | TEXT | "The secular bull remains intact..." |

---

### Layer 2 Scenario Fields

Each scenario has 9 fields. Fields are numbered 1-4 for the 4 scenarios.

#### Scenario 1 (Example: "Midline Reversion", probability 0.5)

| Database Column | JSON Source | Type | Example Value |
|----------------|-------------|------|---------------|
| `scenario1_id` | `layer2.scenario_analysis.scenarios[0].scenario_id` | VARCHAR(10) | "1" |
| `scenario1_name` | `layer2.scenario_analysis.scenarios[0].name` | VARCHAR(100) | "Midline Reversion" |
| `scenario1_probability` | `layer2.scenario_analysis.scenarios[0].probability` | DECIMAL(5,4) | 0.5000 |
| `scenario1_path_summary` | `layer2.scenario_analysis.scenarios[0].path_summary` | TEXT | "A pullback towards..." |
| `scenario1_technical_logic` | `layer2.scenario_analysis.scenarios[0].technical_logic` | TEXT | "Historically, approaches..." |
| `scenario1_target_zone` | `layer2.scenario_analysis.scenarios[0].target_zone_description` | TEXT | "Midline of the secular..." |
| `scenario1_expected_move_min` | `layer2.scenario_analysis.scenarios[0].expected_move_percent[0]` | DECIMAL(6,2) | -10.00 |
| `scenario1_expected_move_max` | `layer2.scenario_analysis.scenarios[0].expected_move_percent[1]` | DECIMAL(6,2) | -18.00 |
| `scenario1_risk_profile` | `layer2.scenario_analysis.scenarios[0].risk_profile` | TEXT | "Moderate risk with..." |

#### Scenario 2, 3, 4
Same structure as Scenario 1, with column names `scenario2_*`, `scenario3_*`, `scenario4_*`.

**Note**: Scenarios are ordered by probability (highest to lowest) in the JSON, so:
- Scenario 1 = Highest probability scenario
- Scenario 2 = Second highest
- Scenario 3 = Third highest
- Scenario 4 = Lowest probability (tail risk)

---

### Layer 3 Fields

| Database Column | JSON Source | Type | Example Value |
|----------------|-------------|------|---------------|
| `scenario_summary_1` | `layer3.scenario_summary[0]` | TEXT | "50% — Pullback toward..." |
| `scenario_summary_2` | `layer3.scenario_summary[1]` | TEXT | "30% — Sideways drift..." |
| `scenario_summary_3` | `layer3.scenario_summary[2]` | TEXT | "12% — Short-lived overshoot..." |
| `scenario_summary_4` | `layer3.scenario_summary[3]` | TEXT | "8% — Macro-shock drop..." |
| `primary_message` | `layer3.primary_message` | TEXT | "Most likely outcome is..." |

---

### File Reference Fields

| Database Column | Source | Type | Example Value |
|----------------|--------|------|---------------|
| `original_chart_url` | File path | TEXT | "/data/2025-11-30/original_chart.png" |
| `annotated_chart_url` | File path (nullable) | TEXT | "/data/2025-11-30/annotated_chart.png" |

---

### Timestamp Fields

| Database Column | Source | Type | Description |
|----------------|--------|------|-------------|
| `created_at` | Auto-generated | TIMESTAMP | Record creation time |
| `updated_at` | Auto-generated | TIMESTAMP | Last update time |

---

## Data Types Explained

### VARCHAR vs TEXT
- **VARCHAR(n)**: Fixed-length strings with known maximum length (e.g., scenario names, IDs)
- **TEXT**: Variable-length strings with no practical limit (e.g., summaries, descriptions)

### DECIMAL(5,4)
- For probabilities: 0.0000 to 0.9999 (e.g., 0.5000 = 50%)
- 5 total digits, 4 after decimal point

### DECIMAL(6,2)
- For percentage moves: -999.99 to 999.99 (e.g., -18.00 = -18%)
- 6 total digits, 2 after decimal point

---

## Constraints

### Uniqueness
- **`asof_date` UNIQUE**: Only one analysis per day
- Upsert logic: `ON CONFLICT (asof_date) DO UPDATE SET ...`

### Indexes
- **`idx_secular_analysis_asof_date`**: B-tree index on `asof_date DESC` for fast latest-record queries

---

## Example Queries

### Get latest analysis (all fields)
```sql
SELECT * FROM secular_analysis 
ORDER BY asof_date DESC 
LIMIT 1;
```

### Get Layer 1 summary
```sql
SELECT 
  asof_date,
  secular_trend,
  channel_position,
  summary_signal
FROM secular_analysis
ORDER BY asof_date DESC
LIMIT 1;
```

### Get all scenarios for a date
```sql
SELECT 
  asof_date,
  scenario1_name, scenario1_probability, scenario1_expected_move_min, scenario1_expected_move_max,
  scenario2_name, scenario2_probability, scenario2_expected_move_min, scenario2_expected_move_max,
  scenario3_name, scenario3_probability, scenario3_expected_move_min, scenario3_expected_move_max,
  scenario4_name, scenario4_probability, scenario4_expected_move_min, scenario4_expected_move_max
FROM secular_analysis
WHERE asof_date = '2025-11-30';
```

### Get highest probability scenario
```sql
SELECT 
  asof_date,
  scenario1_name as scenario_name,
  scenario1_probability as probability,
  scenario1_path_summary as path_summary
FROM secular_analysis
ORDER BY asof_date DESC
LIMIT 1;
```

### Get all scenarios with probability > 20%
```sql
SELECT 
  asof_date,
  'Scenario 1' as scenario, scenario1_name as name, scenario1_probability as prob
FROM secular_analysis
WHERE scenario1_probability > 0.20
UNION ALL
SELECT 
  asof_date,
  'Scenario 2', scenario2_name, scenario2_probability
FROM secular_analysis
WHERE scenario2_probability > 0.20
UNION ALL
SELECT 
  asof_date,
  'Scenario 3', scenario3_name, scenario3_probability
FROM secular_analysis
WHERE scenario3_probability > 0.20
UNION ALL
SELECT 
  asof_date,
  'Scenario 4', scenario4_name, scenario4_probability
FROM secular_analysis
WHERE scenario4_probability > 0.20
ORDER BY asof_date DESC, prob DESC;
```

---

## Upsert Logic

```sql
INSERT INTO secular_analysis (
  asof_date,
  secular_trend,
  secular_regime_status,
  channel_position,
  recent_behavior_summary,
  interpretation,
  risk_bias,
  summary_signal,
  dominant_dynamics,
  overall_bias,
  secular_summary,
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
  original_chart_url,
  annotated_chart_url
) VALUES (
  $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11,
  $12, $13, $14, $15, $16, $17, $18, $19, $20,
  $21, $22, $23, $24, $25, $26, $27, $28, $29,
  $30, $31, $32, $33, $34, $35, $36, $37, $38,
  $39, $40, $41, $42, $43, $44, $45, $46, $47, $48
)
ON CONFLICT (asof_date) 
DO UPDATE SET
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
```

---

## Benefits of Granular Schema

1. **Easy Querying**: Direct column access without JSON parsing
2. **Type Safety**: Database enforces data types (DECIMAL for probabilities, DATE for dates)
3. **Indexing**: Can create indexes on specific columns (e.g., `secular_trend`, `scenario1_probability`)
4. **Aggregation**: Easy to compute statistics (AVG probability, MIN/MAX expected moves)
5. **Compatibility**: Standard SQL queries work across all database tools

---

## Total Column Count

- **Core**: 2 (id, asof_date)
- **Layer 1**: 7 fields
- **Layer 2 Metadata**: 3 fields
- **Layer 2 Scenarios**: 4 scenarios × 9 fields = 36 fields
- **Layer 3**: 5 fields
- **File References**: 2 fields
- **Timestamps**: 2 fields

**Total**: 57 columns
