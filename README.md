# CycleScope Secular

Automated market analysis system that captures StockCharts.com $SPX monthly charts, analyzes them using OpenAI Assistant, annotates with Gemini AI, and stores results in PostgreSQL database.

## Features

- ✅ **Automated StockCharts Chart Capture**: Downloads $SPX monthly chart with RSI(14) using Playwright
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
# StockCharts
STOCKCHARTS_CHART_URL=https://schrts.co/UFNDiHPE

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

# In another terminal, trigger a download (async)
curl -X POST http://localhost:3000/download

# Check download status
curl http://localhost:3000/download-status

# Get latest chart
curl http://localhost:3000/latest-chart -o chart.png
```

**From your local Mac to Railway**:

```bash
# Get your Railway app URL from the Railway dashboard
# Example: https://cyclescope-secular-production.up.railway.app

# Trigger download on Railway (async, returns immediately)
curl -X POST https://your-app.railway.app/download

# Check download status
curl https://your-app.railway.app/download-status

# Get latest chart (after download completes)
curl https://your-app.railway.app/latest-chart -o chart.png
```

### Available API Endpoints

#### 1. Health Check

**`GET /health`** - Check service status and view download status

```bash
curl https://your-app.railway.app/health
```

**Response**:
```json
{
  "status": "ok",
  "service": "cyclescope-secular",
  "timestamp": "2025-11-30T04:22:51.284Z",
  "config": {
    "dataDir": "/data",
    "retentionDays": 30,
    "chartUrl": "https://www.tradingview.com/chart/..."
  },
  "downloadStatus": {
    "isRunning": false,
    "lastStartTime": "2025-11-30T04:20:00.000Z",
    "lastEndTime": "2025-11-30T04:21:30.000Z",
    "lastSuccess": true,
    "lastError": null,
    "lastFilePath": "/data/2025-11-30/original_chart.png"
  }
}
```

#### 2. Download Chart (Async - Recommended)

**`POST /download`** - Trigger chart download in background (returns immediately)

```bash
curl -X POST https://your-app.railway.app/download
```

**Response** (returns in < 1 second):
```json
{
  "success": true,
  "message": "Download started in background",
  "date": "2025-11-30",
  "status": "processing",
  "timestamp": "2025-11-30T04:22:51.284Z",
  "statusUrl": "/download-status"
}
```

**Key Features**:
- ✅ Returns immediately (< 1 second)
- ✅ Download runs in background (~60 seconds)
- ✅ Server remains responsive during download
- ✅ Health check continues to work
- ✅ Prevents Railway timeout issues

#### 3. Check Download Status

**`GET /download-status`** - Check the status of background download

```bash
curl https://your-app.railway.app/download-status
```

**Response**:
```json
{
  "success": true,
  "status": {
    "isRunning": true,
    "lastStartTime": "2025-11-30T04:22:51.284Z",
    "lastEndTime": null,
    "lastSuccess": null,
    "lastError": null,
    "lastFilePath": null
  },
  "timestamp": "2025-11-30T04:23:00.000Z"
}
```

#### 4. Get Latest Chart

**`GET /latest-chart`** - Get the latest downloaded chart (if exists)

```bash
# View in browser
open https://your-app.railway.app/latest-chart

# Or download with curl
curl https://your-app.railway.app/latest-chart -o latest-chart.png
```

**Response**: PNG file (image/png) or 404 if no chart exists for today

#### 5. Download File (Sync - For Manual Testing Only)

**`POST /download-file`** - Download chart and return PNG file directly (waits ~60 seconds)

```bash
# Download chart and save to local machine
curl -X POST https://your-app.railway.app/download-file -o chart.png

# Or with custom filename
curl -X POST https://your-app.railway.app/download-file -o "secular-chart-$(date +%Y-%m-%d).png"
```

**Response**: PNG file (image/png) with filename `chart-YYYY-MM-DD.png`

**Note**: This endpoint waits for the download to complete (~60 seconds). Use `/download` + `/download-status` for async operation.

### Recommended Usage Pattern

**For GitHub Actions (automated daily updates)**:
```bash
# 1. Trigger download in background
curl -X POST https://your-app.railway.app/download

# 2. Wait a bit
sleep 10

# 3. Poll status until complete
while true; do
  STATUS=$(curl -s https://your-app.railway.app/download-status | jq -r '.status.isRunning')
  if [ "$STATUS" = "false" ]; then
    break
  fi
  echo "Download in progress..."
  sleep 5
done

# 4. Get the latest chart
curl https://your-app.railway.app/latest-chart -o chart.png
```

**For manual testing from Mac**:
```bash
# Option 1: Quick download (waits for completion)
curl -X POST https://your-app.railway.app/download-file -o chart.png

# Option 2: Async download (check status separately)
curl -X POST https://your-app.railway.app/download
# Wait ~60 seconds, then:
curl https://your-app.railway.app/latest-chart -o chart.png
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

**StockCharts Download Test**: ✅ PASSED

- Chart URL: `https://schrts.co/UFNDiHPE`
- Chart: $SPX S&P 500 Large Cap Index (Monthly, 1980-present)
- Indicator: RSI(14) with 30/70 reference lines
- Screenshot size: ~51 KB (1100x555 PNG, cropped)
- No login required (public chart)
- File saved to: `/tmp/cyclescope-data/2025-11-30/original_chart.png`

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
