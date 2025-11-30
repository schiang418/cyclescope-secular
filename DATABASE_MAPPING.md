# CycleScope Secular - Database Field Mapping

This document describes how the OpenAI Assistant JSON output maps to the PostgreSQL database schema.

---

## Database Schema

```sql
CREATE TABLE IF NOT EXISTS secular_analysis (
  id SERIAL PRIMARY KEY,
  asof_date DATE NOT NULL UNIQUE,
  layer1_json JSONB NOT NULL,
  layer2_json JSONB NOT NULL,
  layer3_json JSONB NOT NULL,
  original_chart_url TEXT,
  annotated_chart_url TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## Field Mapping

### Core Fields

| Database Column | Source | Description |
|----------------|--------|-------------|
| `id` | Auto-generated | Primary key (serial) |
| `asof_date` | `layer1.asof_date` | Analysis date (UNIQUE constraint - one record per day) |
| `layer1_json` | Entire `layer1` object | Layer 1 analysis (JSONB) |
| `layer2_json` | Entire `layer2` object | Layer 2 scenario analysis (JSONB) |
| `layer3_json` | Entire `layer3` object | Layer 3 summary (JSONB) |
| `original_chart_url` | File path | Path to original chart image |
| `annotated_chart_url` | File path | Path to Gemini-annotated chart (nullable) |
| `created_at` | Auto-generated | Record creation timestamp |
| `updated_at` | Auto-generated | Record update timestamp |

---

## Layer 1 JSON Structure

Stored in `layer1_json` column as JSONB.

```json
{
  "asof_date": "2025-11-30",
  "secular_trend": "Secular Bull",
  "secular_regime_status": "Active Secular Bull",
  "channel_position": "below_upper_band_no_overshoot",
  "recent_behavior_summary": "...",
  "interpretation": "...",
  "risk_bias": "...",
  "summary_signal": "..."
}
```

### Layer 1 Fields

| JSON Field | Type | Description |
|-----------|------|-------------|
| `asof_date` | string (date) | Analysis date (YYYY-MM-DD) |
| `secular_trend` | string | Current secular trend (e.g., "Secular Bull") |
| `secular_regime_status` | string | Regime status (e.g., "Active Secular Bull") |
| `channel_position` | string | Position relative to channel bands |
| `recent_behavior_summary` | string | Summary of recent market behavior |
| `interpretation` | string | Interpretation of current position |
| `risk_bias` | string | Risk assessment |
| `summary_signal` | string | Overall signal summary |

---

## Layer 2 JSON Structure

Stored in `layer2_json` column as JSONB.

```json
{
  "asof_date": "2025-11-30",
  "scenario_analysis": {
    "dominant_dynamics": "...",
    "scenarios": [
      {
        "scenario_id": "1",
        "name": "Midline Reversion",
        "probability": 0.5,
        "path_summary": "...",
        "technical_logic": "...",
        "target_zone_description": "...",
        "expected_move_percent": [-10, -18],
        "risk_profile": "..."
      }
    ],
    "overall_bias": "...",
    "secular_summary": "..."
  }
}
```

### Layer 2 Fields

| JSON Field | Type | Description |
|-----------|------|-------------|
| `asof_date` | string (date) | Analysis date |
| `scenario_analysis` | object | Container for scenario analysis |
| `scenario_analysis.dominant_dynamics` | string | Description of dominant market dynamics |
| `scenario_analysis.scenarios` | array | Array of scenario objects (typically 4) |
| `scenario_analysis.overall_bias` | string | Overall market bias |
| `scenario_analysis.secular_summary` | string | Summary of secular trend |

### Scenario Object Structure

| JSON Field | Type | Description |
|-----------|------|-------------|
| `scenario_id` | string | Scenario identifier ("1", "2", "3", "4") |
| `name` | string | Scenario name (e.g., "Midline Reversion") |
| `probability` | number | Probability (0.0 to 1.0) |
| `path_summary` | string | Summary of expected path |
| `technical_logic` | string | Technical reasoning |
| `target_zone_description` | string | Target zone description |
| `expected_move_percent` | array[number, number] | Expected move range [min, max] |
| `risk_profile` | string | Risk assessment for this scenario |

---

## Layer 3 JSON Structure

Stored in `layer3_json` column as JSONB.

```json
{
  "asof_date": "2025-11-30",
  "scenario_summary": [
    "50% — Pullback toward the secular midline (−10% to −18%)",
    "30% — Sideways drift beneath the upper band (−5% to +5%)",
    "12% — Short-lived overshoot above the upper band (+5% to +15%)",
    "8% — Macro-shock drop toward the lower band (−25% to −35%)"
  ],
  "primary_message": "Most likely outcome is a midline reversion or sideways consolidation..."
}
```

### Layer 3 Fields

| JSON Field | Type | Description |
|-----------|------|-------------|
| `asof_date` | string (date) | Analysis date |
| `scenario_summary` | array[string] | Array of formatted scenario summaries (4 items) |
| `primary_message` | string | Primary takeaway message |

---

## Data Constraints

### Uniqueness
- **`asof_date` is UNIQUE**: Only one analysis per day is allowed
- If analysis is run multiple times on the same day, it will **UPDATE** the existing record instead of creating a new one

### JSONB Storage
- All three layers are stored as **JSONB** (not plain JSON)
- This allows for:
  - Efficient querying of nested fields
  - Indexing on specific JSON paths
  - Smaller storage footprint

### Timestamps
- `created_at`: Set once when record is first created
- `updated_at`: Updated every time the record is modified

---

## Example Query

### Get latest analysis
```sql
SELECT * FROM secular_analysis 
ORDER BY asof_date DESC 
LIMIT 1;
```

### Get analysis for specific date
```sql
SELECT * FROM secular_analysis 
WHERE asof_date = '2025-11-30';
```

### Query specific Layer 1 field
```sql
SELECT 
  asof_date,
  layer1_json->>'secular_trend' as secular_trend,
  layer1_json->>'channel_position' as channel_position
FROM secular_analysis
ORDER BY asof_date DESC;
```

### Query Layer 2 scenarios
```sql
SELECT 
  asof_date,
  jsonb_array_elements(layer2_json->'scenario_analysis'->'scenarios') as scenario
FROM secular_analysis
WHERE asof_date = '2025-11-30';
```

---

## Upsert Logic

When saving analysis, use PostgreSQL's `ON CONFLICT` to ensure one record per day:

```sql
INSERT INTO secular_analysis (
  asof_date, 
  layer1_json, 
  layer2_json, 
  layer3_json,
  original_chart_url,
  annotated_chart_url
) VALUES ($1, $2, $3, $4, $5, $6)
ON CONFLICT (asof_date) 
DO UPDATE SET
  layer1_json = EXCLUDED.layer1_json,
  layer2_json = EXCLUDED.layer2_json,
  layer3_json = EXCLUDED.layer3_json,
  original_chart_url = EXCLUDED.original_chart_url,
  annotated_chart_url = EXCLUDED.annotated_chart_url,
  updated_at = CURRENT_TIMESTAMP
RETURNING *;
```

This ensures:
- ✅ First run: Creates new record
- ✅ Subsequent runs on same day: Updates existing record
- ✅ `created_at` preserved, `updated_at` refreshed
- ✅ Consistent with cyclescope-downloader's one-folder-per-day pattern

---

## Notes

1. **Date Format**: All dates use ISO 8601 format (YYYY-MM-DD)
2. **Probabilities**: Stored as decimals (0.0 to 1.0), not percentages
3. **Chart URLs**: Store file paths, not HTTP URLs (e.g., `/data/2025-11-30/original_chart.png`)
4. **Nullable Fields**: `annotated_chart_url` can be NULL if Gemini annotation hasn't run yet
