# StartFresh Iraqi Business Collection System

Simplified, reliable backend system for Iraqi business data collection with immediate persistence and crash recovery.

## 🎯 Features

- **Backend-first only**: No frontend dependencies, browser-independent
- **Immediate persistence**: Every valid business saved instantly to database
- **Crash recovery**: Jobs resume automatically on server restart
- **Simple architecture**: Reusable agent engine, not 18 different files
- **Target-based collection**: 10 businesses per city+category
- **Multi-source data**: OpenStreetMap, Foursquare, Gemini verification
- **Real-time dashboard**: Simple web interface for progress monitoring
- **Queue management**: Safe concurrent job execution (max 2)

## 📁 Project Structure

```
startfresh/
├── package.json
├── .gitignore
├── .env.example
├── README.md
├── server.js
├── database-schema.sql
├── dashboard/
│   ├── index.html
│   ├── app.js
│   └── styles.css
└── src/
    ├── config/
    │   ├── constants.js
    │   ├── categories.js
    │   ├── governorates.js
    │   └── cityMap.js
    ├── db/
    │   ├── supabase.js
    │   ├── jobs.js
    │   ├── businesses.js
    │   └── progress.js
    ├── agents/
    │   ├── governorateRunner.js
    │   ├── cityRunner.js
    │   ├── categoryRunner.js
    │   └── resumeInterruptedJobs.js
    ├── services/
    │   ├── validator.js
    │   ├── normalizer.js
    │   ├── persistence.js
    │   ├── targetCounter.js
    │   └── queueManager.js
    ├── sources/
    │   ├── openstreetmapSource.js
    │   ├── foursquareSource.js
    │   ├── geminiVerifier.js
    │   └── mergeSources.js
    ├── routes/
    │   ├── startGovernorateRoute.js
    │   ├── startAllRoute.js
    │   ├── jobStatusRoute.js
    │   └── dashboardRoute.js
    └── utils/
        ├── logger.js
        ├── sleep.js
        └── safeJsonParse.js
```

## 🚀 Quick Start

### 1. Environment Setup

```bash
# Copy environment template
cp .env.example .env

# Edit .env with your credentials
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
SUPABASE_ANON_KEY=your_anon_key
GEMINI_API_KEY=your_gemini_api_key
FOURSQUARE_API_KEY=your_foursquare_api_key
PORT=3000
NODE_ENV=development
```

### 2. Database Setup

1. Create a new Supabase project
2. Run the `database-schema.sql` in the Supabase SQL Editor
3. Enable RLS policies (included in schema)

### 3. Install and Run

```bash
# Install dependencies
npm install

# Start the server
npm start

# Or for development
npm run dev
```

Visit `http://localhost:3000` to see the dashboard.

## 📊 API Endpoints

### Start Collection
- `POST /api/start-governorate` - Start collection for one governorate
- `POST /api/start-all` - Start collection for all 18 governorates

### Monitor Progress
- `GET /api/job/:id` - Get detailed job status
- `GET /api/dashboard` - Get dashboard overview
- `GET /api/dashboard/summary` - Get summary by location

### System
- `GET /health` - Health check and queue status
- `GET /` - Dashboard interface

## 🏛️ Governorates Covered

18 Iraqi governorates with multiple cities each:
- Baghdad, Basra, Najaf, Karbala, Erbil, Duhok, Sulaymaniyah
- Mosul, Kirkuk, Dhi Qar, Maysan, Muthanna, Al Anbar
- Babil, Diyala, Wasit, Saladin, Al-Qadisiyyah

## 📈 Categories (20)

Restaurants, Hotels, Pharmacies, Supermarkets, Gas stations, Hospitals, Schools, Banks, Clothing stores, Electronics stores, Car repair, Beauty salons, Cafes, Bakeries, Bookstores, Hardware stores, Jewelry stores, Mobile phone stores, Furniture stores, Fitness centers

## 🔄 Collection Logic

For each governorate → city → category:
1. Fetch from OpenStreetMap + Foursquare
2. Validate businesses (name, category, city required)
3. Normalize and deduplicate
4. Save immediately to database
5. Stop when 10 valid businesses saved
6. Move to next category

## 💾 Persistence & Recovery

- **Immediate saving**: Every valid business saved instantly
- **Job tracking**: Progress stored in database
- **Crash recovery**: Jobs resume on server restart
- **No browser dependency**: Work continues even if frontend crashes

## �️ Data Quality

- **Strict validation**: Name, category, city must be ≥2 characters
- **Deduplication**: Based on normalized_name + "|" + city + "|" + phone
- **Source verification**: Gemini AI used for verification, not primary source
- **Real data only**: Prioritizes actual business data over AI hallucinations

## 📱 Dashboard Features

- Real-time job progress
- Governorate and city status
- Category completion tracking
- Recent logs and errors
- Start/stop controls
### POST /api/full-iraq-coverage
Run all governorates and categories

**Request:**
```json
{}
```

### GET /api/job/:id
Get job status and progress

**Response:**
```json
{
  "success": true,
  "job": {
    "id": "uuid",
    "governorate": "Baghdad",
    "category": "restaurants",
    "status": "running",
    "progress": 70,
    "current_step": "DEDUPLICATING",
    "businesses_found": 25,
    "businesses_saved": 18
  },
  "staging": {
    "total": 25,
    "pending": 2,
    "duplicate": 5,
    "promoted": 18
  }
}
```

### GET /health
Health check and queue status

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T12:00:00Z",
  "queue": {
    "running": 1,
    "maxConcurrent": 2,
    "queued": 0,
    "canStartNew": true
  }
}
```

## 🔧 System Configuration

### Constants (src/config/constants.js)
- `MAX_CONCURRENT_JOBS`: 2
- `MAX_RETRIES`: 3
- `SOURCE_DELAY_MS`: 3000
- `MAX_BUSINESSES_PER_RUN`: 30

### Categories
15 business categories including restaurants, hotels, pharmacies, etc.

### Governorates
18 Iraqi governorates from Baghdad to Al-Qadisiyyah

## 📈 Data Flow

```
API Request → Create Job → Fetch Sources → Validate → Normalize → Save to Staging → Check Duplicates → Promote to Businesses → Complete Job
```

**Key Features:**
- **Immediate Persistence**: Valid records saved to staging instantly
- **Per-Record Processing**: Individual record failures don't stop jobs
- **Smart Deduplication**: Uses normalized keys for duplicate detection
- **Queue Management**: Prevents server overload with concurrent limits

## 🛡️ Safety Features

- **No Data Loss**: Every validated record persists immediately
- **Job Recovery**: Interrupted jobs resume automatically
- **Rate Limiting**: Delays between API calls to avoid being blocked
- **Error Isolation**: Per-record error handling prevents job failures
- **Queue Limits**: Maximum concurrent jobs prevents server overload

## 📝 Logs

Logs are written to `logs/qahbaxana-YYYY-MM-DD.log` with:
- Timestamps
- Job IDs for tracking
- Progress updates
- Error details

## 🚨 Important Notes

- **Backend Only**: No frontend components - pure server-side system
- **Browser Independent**: Works even if browser closes or laptop sleeps
- **Production Ready**: Built for real-world deployment with error handling
- **Scalable**: Queue management allows safe horizontal scaling

## 🤝 Contributing

This is a production system designed for reliability and data integrity. All changes should:
- Preserve immediate persistence behavior
- Maintain job recovery functionality
- Keep queue management intact
- Include proper error handling
