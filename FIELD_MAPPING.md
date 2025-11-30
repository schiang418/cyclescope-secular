# Database Column ↔ JSON Field Mapping

Complete mapping between PostgreSQL database columns and OpenAI Assistant JSON output fields.

---

## Core Fields

| Database Column | JSON Path | Data Type | Example Value |
|----------------|-----------|-----------|---------------|
| `id` | (auto-generated) | SERIAL | 1 |
| `asof_date` | `layer1.asof_date` | DATE | 2025-11-30 |

---

## Layer 1 Fields (7 columns)

| Database Column | JSON Path | Data Type | Example Value |
|----------------|-----------|-----------|---------------|
| `secular_trend` | `layer1.secular_trend` | VARCHAR(100) | "Secular Bull" |
| `secular_regime_status` | `layer1.secular_regime_status` | VARCHAR(100) | "Active Secular Bull" |
| `channel_position` | `layer1.channel_position` | VARCHAR(100) | "below_upper_band_no_overshoot" |
| `recent_behavior_summary` | `layer1.recent_behavior_summary` | TEXT | "The SPX is currently positioned just below..." |
| `interpretation` | `layer1.interpretation` | TEXT | "The market is in a mature phase of the secular bull..." |
| `risk_bias` | `layer1.risk_bias` | TEXT | "Moderate risk of correction due to proximity..." |
| `summary_signal` | `layer1.summary_signal` | TEXT | "Cautiously bullish with a watchful eye..." |

---

## Layer 2 Metadata Fields (3 columns)

| Database Column | JSON Path | Data Type | Example Value |
|----------------|-----------|-----------|---------------|
| `dominant_dynamics` | `layer2.scenario_analysis.dominant_dynamics` | TEXT | "The market is navigating the upper region..." |
| `overall_bias` | `layer2.scenario_analysis.overall_bias` | TEXT | "Cautiously optimistic with a focus on managing..." |
| `secular_summary` | `layer2.scenario_analysis.secular_summary` | TEXT | "The secular bull remains intact, but vigilance..." |

---

## Layer 2 Scenario 1 Fields (9 columns)

| Database Column | JSON Path | Data Type | Example Value |
|----------------|-----------|-----------|---------------|
| `scenario1_id` | `layer2.scenario_analysis.scenarios[0].scenario_id` | VARCHAR(10) | "1" |
| `scenario1_name` | `layer2.scenario_analysis.scenarios[0].name` | VARCHAR(100) | "Midline Reversion" |
| `scenario1_probability` | `layer2.scenario_analysis.scenarios[0].probability` | DECIMAL(5,4) | 0.5000 |
| `scenario1_path_summary` | `layer2.scenario_analysis.scenarios[0].path_summary` | TEXT | "A pullback towards the secular midline..." |
| `scenario1_technical_logic` | `layer2.scenario_analysis.scenarios[0].technical_logic` | TEXT | "Historically, approaches to the upper rail..." |
| `scenario1_target_zone` | `layer2.scenario_analysis.scenarios[0].target_zone_description` | TEXT | "Midline of the secular bull channel" |
| `scenario1_expected_move_min` | `layer2.scenario_analysis.scenarios[0].expected_move_percent[0]` | DECIMAL(6,2) | -10.00 |
| `scenario1_expected_move_max` | `layer2.scenario_analysis.scenarios[0].expected_move_percent[1]` | DECIMAL(6,2) | -18.00 |
| `scenario1_risk_profile` | `layer2.scenario_analysis.scenarios[0].risk_profile` | TEXT | "Moderate risk with potential for a healthy..." |

---

## Layer 2 Scenario 2 Fields (9 columns)

| Database Column | JSON Path | Data Type | Example Value |
|----------------|-----------|-----------|---------------|
| `scenario2_id` | `layer2.scenario_analysis.scenarios[1].scenario_id` | VARCHAR(10) | "2" |
| `scenario2_name` | `layer2.scenario_analysis.scenarios[1].name` | VARCHAR(100) | "Sideways Drift" |
| `scenario2_probability` | `layer2.scenario_analysis.scenarios[1].probability` | DECIMAL(5,4) | 0.3000 |
| `scenario2_path_summary` | `layer2.scenario_analysis.scenarios[1].path_summary` | TEXT | "The market may consolidate sideways beneath..." |
| `scenario2_technical_logic` | `layer2.scenario_analysis.scenarios[1].technical_logic` | TEXT | "Sideways movement is common when the market..." |
| `scenario2_target_zone` | `layer2.scenario_analysis.scenarios[1].target_zone_description` | TEXT | "Beneath the upper band" |
| `scenario2_expected_move_min` | `layer2.scenario_analysis.scenarios[1].expected_move_percent[0]` | DECIMAL(6,2) | -5.00 |
| `scenario2_expected_move_max` | `layer2.scenario_analysis.scenarios[1].expected_move_percent[1]` | DECIMAL(6,2) | 5.00 |
| `scenario2_risk_profile` | `layer2.scenario_analysis.scenarios[1].risk_profile` | TEXT | "Low risk with limited downside." |

---

## Layer 2 Scenario 3 Fields (9 columns)

| Database Column | JSON Path | Data Type | Example Value |
|----------------|-----------|-----------|---------------|
| `scenario3_id` | `layer2.scenario_analysis.scenarios[2].scenario_id` | VARCHAR(10) | "3" |
| `scenario3_name` | `layer2.scenario_analysis.scenarios[2].name` | VARCHAR(100) | "Upper Band Overshoot" |
| `scenario3_probability` | `layer2.scenario_analysis.scenarios[2].probability` | DECIMAL(5,4) | 0.1200 |
| `scenario3_path_summary` | `layer2.scenario_analysis.scenarios[2].path_summary` | TEXT | "A short-lived overshoot above the upper band..." |
| `scenario3_technical_logic` | `layer2.scenario_analysis.scenarios[2].technical_logic` | TEXT | "Momentum-driven overshoots are possible in..." |
| `scenario3_target_zone` | `layer2.scenario_analysis.scenarios[2].target_zone_description` | TEXT | "Above the upper band" |
| `scenario3_expected_move_min` | `layer2.scenario_analysis.scenarios[2].expected_move_percent[0]` | DECIMAL(6,2) | 5.00 |
| `scenario3_expected_move_max` | `layer2.scenario_analysis.scenarios[2].expected_move_percent[1]` | DECIMAL(6,2) | 15.00 |
| `scenario3_risk_profile` | `layer2.scenario_analysis.scenarios[2].risk_profile` | TEXT | "Higher risk due to potential for sharp..." |

---

## Layer 2 Scenario 4 Fields (9 columns)

| Database Column | JSON Path | Data Type | Example Value |
|----------------|-----------|-----------|---------------|
| `scenario4_id` | `layer2.scenario_analysis.scenarios[3].scenario_id` | VARCHAR(10) | "4" |
| `scenario4_name` | `layer2.scenario_analysis.scenarios[3].name` | VARCHAR(100) | "Macro-Shock Drop" |
| `scenario4_probability` | `layer2.scenario_analysis.scenarios[3].probability` | DECIMAL(5,4) | 0.0800 |
| `scenario4_path_summary` | `layer2.scenario_analysis.scenarios[3].path_summary` | TEXT | "A macroeconomic shock could trigger a..." |
| `scenario4_technical_logic` | `layer2.scenario_analysis.scenarios[3].technical_logic` | TEXT | "External shocks can lead to rapid declines..." |
| `scenario4_target_zone` | `layer2.scenario_analysis.scenarios[3].target_zone_description` | TEXT | "Lower band of the secular bull channel" |
| `scenario4_expected_move_min` | `layer2.scenario_analysis.scenarios[3].expected_move_percent[0]` | DECIMAL(6,2) | -25.00 |
| `scenario4_expected_move_max` | `layer2.scenario_analysis.scenarios[3].expected_move_percent[1]` | DECIMAL(6,2) | -35.00 |
| `scenario4_risk_profile` | `layer2.scenario_analysis.scenarios[3].risk_profile` | TEXT | "High risk with significant downside potential." |

---

## Layer 3 Fields (5 columns)

| Database Column | JSON Path | Data Type | Example Value |
|----------------|-----------|-----------|---------------|
| `scenario_summary_1` | `layer3.scenario_summary[0]` | TEXT | "50% — Pullback toward the secular midline (−10% to −18%)" |
| `scenario_summary_2` | `layer3.scenario_summary[1]` | TEXT | "30% — Sideways drift beneath the upper band (−5% to +5%)" |
| `scenario_summary_3` | `layer3.scenario_summary[2]` | TEXT | "12% — Short-lived overshoot above the upper band (+5% to +15%)" |
| `scenario_summary_4` | `layer3.scenario_summary[3]` | TEXT | "8% — Macro-shock drop toward the lower band (−25% to −35%)" |
| `primary_message` | `layer3.primary_message` | TEXT | "Most likely outcome is a midline reversion or sideways..." |

---

## File Reference Fields (2 columns)

| Database Column | Source | Data Type | Example Value |
|----------------|--------|-----------|---------------|
| `original_chart_url` | File path | TEXT | "/data/2025-11-30/original_chart.png" |
| `annotated_chart_url` | File path (nullable) | TEXT | "/data/2025-11-30/annotated_chart.png" |

---

## Timestamp Fields (2 columns)

| Database Column | Source | Data Type | Description |
|----------------|--------|-----------|-------------|
| `created_at` | Auto-generated | TIMESTAMP | Record creation timestamp |
| `updated_at` | Auto-generated | TIMESTAMP | Last update timestamp |

---

## Summary

- **Total Columns**: 57
- **Layer 1**: 7 columns
- **Layer 2 Metadata**: 3 columns
- **Layer 2 Scenarios**: 36 columns (4 scenarios × 9 fields each)
- **Layer 3**: 5 columns
- **Other**: 6 columns (id, asof_date, 2 file URLs, 2 timestamps)

---

## Notes

1. **Array Indexing**: JSON arrays are 0-indexed
   - `scenarios[0]` → Scenario 1 (highest probability)
   - `scenarios[1]` → Scenario 2
   - `scenarios[2]` → Scenario 3
   - `scenarios[3]` → Scenario 4 (lowest probability, tail risk)

2. **Probability Format**: 
   - JSON: decimal (0.5 = 50%)
   - Database: DECIMAL(5,4) stores as 0.5000

3. **Expected Move Format**:
   - JSON: array of 2 numbers `[-10, -18]`
   - Database: 2 separate columns `expected_move_min` and `expected_move_max`

4. **Unique Constraint**: 
   - `asof_date` has UNIQUE constraint
   - Only one record per day allowed
   - Upsert logic: INSERT ... ON CONFLICT (asof_date) DO UPDATE

5. **Nullable Fields**:
   - `annotated_chart_url` can be NULL (if Gemini annotation hasn't run yet)
   - All other fields should be NOT NULL (enforced by application logic)
