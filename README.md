# CycleScope Secular

Automated market analysis system that captures TradingView Secular Bull Channel charts, analyzes them using OpenAI Assistant, annotates with Gemini AI, and stores results in PostgreSQL database.

## Features

- ✅ **Automated TradingView Chart Capture**: Downloads "Secular bull channel" chart using Playwright
- 🔄 **OpenAI Secular Assistant Integration**: Analyzes charts with 3-layer structured output (Layer 1, 2, 3)
- 🎨 **Gemini Chart Annotation**: Adds AI-generated annotations to charts
- 💾 **PostgreSQL Storage**: Stores analysis results and chart URLs in database
- 📅 **Date-based File Management**: Organizes files by date, auto-cleanup after 30 days
- ⏰ **GitHub Actions Automation**: Runs Monday-Friday at 6:00 PM Taiwan time

## Project Structure

```
cyclescope-secular/
├── src/
│   ├── config.js                 # Configuration management
│   ├── index.js                  # Main orchestrator
│   ├── test-download.js          # Test script for TradingView download
│   ├── services/
│   │   ├── tradingview.js        # TradingView chart downloader
│   │   ├── openai.js             # OpenAI Secular Assistant client
│   │   ├── gemini.js             # Gemini annotation service
│   │   └── database.js           # PostgreSQL database operations
│   └── utils/
│       ├── date.js               # Date utility functions
│       └── storage.js            # File storage management
├── package.json
├── .env                          # Environment variables (not in git)
├── .env.example                  # Environment variables template
└── README.md
```

## Data Structure

### Volume Data (Persistent Storage)

```
/data/
└── YYYY-MM-DD/                   # Date directory (e.g., 2025-11-29)
    ├── original_chart.png        # TradingView screenshot
    ├── annotated_chart.png       # Gemini annotated chart
    ├── secular_analysis.json     # Full 3-layer JSON from OpenAI
    └── metadata.json             # Optional metadata
```

### Database Schema

```sql
CREATE TABLE secular_analysis (
  id SERIAL PRIMARY KEY,
  asof_date DATE NOT NULL UNIQUE,
  layer1_json JSONB NOT NULL,
  layer2_json JSONB NOT NULL,
  layer3_json JSONB NOT NULL,
  original_chart_url TEXT NOT NULL,
  annotated_chart_url TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

## Setup

### Prerequisites

- Node.js >= 18.0.0
- PostgreSQL database
- OpenAI API key
- Gemini API key

### Installation

```bash
# Clone repository
git clone https://github.com/schiang418/cyclescope-secular.git
cd cyclescope-secular

# Install dependencies
npm install

# Install Playwright browsers
npx playwright install chromium

# Configure environment variables
cp .env.example .env
# Edit .env with your credentials
```

### Environment Variables

```bash
# TradingView
TRADINGVIEW_CHART_URL=https://www.tradingview.com/chart/JUw67EaN/

# OpenAI
OPENAI_API_KEY=sk-proj-...
OPENAI_ASSISTANT_ID=asst_Avw3WLDShSyQbeSQgscnuhqu

# Gemini
GEMINI_API_KEY=AIzaSyD6pkT0UdcWpPZVmgnC_f5X_6JHFv72hs0

# Database
DATABASE_URL=postgresql://user:password@host:port/database

# Storage
DATA_DIR=/data
RETENTION_DAYS=30
```

## Usage

### Option 1: API Endpoint (Recommended)

Start the server and trigger downloads via HTTP API:

```bash
# Start the server
npm start

# In another terminal, trigger a download
curl -X POST http://localhost:3000/download

# Check health status
curl http://localhost:3000/health
```

**From your local Mac to Railway**:

```bash
# Get your Railway app URL from the Railway dashboard
# Example: https://cyclescope-secular-production.up.railway.app

# Trigger download on Railway
curl -X POST https://your-app.railway.app/download

# Check health
curl https://your-app.railway.app/health
```

**API Response**:

```json
{
  "success": true,
  "message": "Chart downloaded successfully",
  "date": "2025-11-29",
  "filePath": "/data/2025-11-29/original_chart.png",
  "timestamp": "2025-11-30T02:22:51.284Z"
}
```

### Option 2: Direct Script Execution

```bash
# Test TradingView download
npm test

# Or with login (recommended)
npm run test:login
```

This will:
1. Download the TradingView chart
2. Save it to `/data/YYYY-MM-DD/original_chart.png`
3. Display success message with file path

### Run Full Analysis (Coming Soon)

```bash
npm start
```

This will:
1. Download TradingView chart
2. Analyze with OpenAI Secular Assistant
3. Annotate with Gemini
4. Save to database
5. Clean up old files (>30 days)

## Development Status

### ✅ Completed

- [x] Project structure and configuration
- [x] Date utility functions
- [x] File storage management
- [x] TradingView chart downloader
- [x] Popup handling and chart capture
- [x] Test script for download functionality

### 🔄 In Progress

- [ ] OpenAI Secular Assistant integration
- [ ] Gemini chart annotation
- [ ] Database operations
- [ ] Main orchestrator logic

### 📋 Todo

- [ ] GitHub Actions workflow
- [ ] cyclescope-portal Fusion V2 integration
- [ ] Railway deployment
- [ ] End-to-end testing

## Testing

### Test Results

**TradingView Download Test**: ✅ PASSED

- Chart URL: `https://www.tradingview.com/chart/JUw67EaN/`
- Screenshot size: 171 KB (1920x1080 PNG)
- Popup handling: Working
- File saved to: `/tmp/cyclescope-data/2025-11-29/original_chart.png`

## Deployment

### Railway Configuration

```yaml
Environment Variables:
  - DATA_DIR=/data
  - DATABASE_URL=postgresql://...
  - OPENAI_API_KEY=sk-proj-...
  - GEMINI_API_KEY=AIzaSy...

Volume:
  - Mount path: /data
  - Size: 1GB
```

### GitHub Actions

```yaml
Schedule:
  - cron: '0 10 * * 1-5'  # Mon-Fri 6:00 PM Taiwan (UTC+8)
```

## License

MIT

## Author

schiang418

## Related Projects

- [cyclescope-downloader](https://github.com/schiang418/cyclescope-downloader) - StockCharts data downloader
- [cyclescope-api](https://github.com/schiang418/cyclescope-api) - CycleScope API server
- [cyclescope-portal](https://github.com/schiang418/cyclescope-portal) - CycleScope web portal
