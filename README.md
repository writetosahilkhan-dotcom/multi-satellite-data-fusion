# 🛰️ Multi-Satellite Data Fusion

A comprehensive real-time satellite tracking and environmental monitoring platform that combines the best features from three separate projects into one powerful multi-satellite data fusion system.

![Version](https://img.shields.io/badge/version-3.0.0-blue)
![Python](https://img.shields.io/badge/python-3.9+-green)
![React](https://img.shields.io/badge/react-18.2-61dafb)
![TypeScript](https://img.shields.io/badge/typescript-5.2-3178c6)

## ✨ Features

### 🌍 Environmental Risk Monitoring
- **NDWI Analysis** - Normalized Difference Water Index for water detection
- **Terrain Analysis** - Digital Elevation Model (DEM) slope calculations
- **Rainfall Risk Assessment** - Multi-factor risk scoring
- **GeoJSON Risk Zones** - Interactive map visualization with HIGH/MEDIUM/LOW alerts
- **Real Satellite Data** - Integration with Microsoft Planetary Computer (Sentinel-2, Landsat)

### 🛰️ Multi-Satellite Tracking
- **Real-time Telemetry** - Track 8+ satellites simultaneously
- **Orbital Visualization** - Live position updates with Lissajous curve simulations
- **Pass Predictions** - Next 24-hour satellite pass forecasts
- **Telemetry Data** - Signal strength, battery, temperature, velocity, altitude
- **Coverage Analysis** - Geographic coverage area calculations

### 📊 Data Fusion & Analytics
- **Fusion Metrics** - Aggregated statistics across all satellites
- **Confidence Scoring** - AI-powered risk assessment
- **Data Throughput** - Real-time data rate monitoring
- **Historical Tracking** - Database storage with SQLite

### 🤖 AI-Powered Insights
- **Google Gemini Integration** - Natural language risk analysis
- **Smart Recommendations** - Actionable insights for risk mitigation
- **Contextual Analysis** - Region-specific environmental assessments

### 🎨 Modern UI/UX
- **Space-Themed Design** - Dark mode with cyan/purple accents
- **Interactive Maps** - Real-time satellite position overlay with OpenStreetMap
- **Real-time Updates** - Auto-refresh every 30 seconds
- **Responsive Layout** - Works on desktop, tablet, and mobile
- **Toast Notifications** - User-friendly alerts and confirmations

### ⚠️ Disaster Early Warning System
- **Weather Alerts** - Storms, heavy rainfall, strong winds monitoring
- **Flood Risk Zones** - Real-time flood risk assessment with population data
- **Fire Hotspots** - Active fire detection and tracking
- **Seismic Activity** - Earthquake monitoring and magnitude tracking
- **Drought Indicators** - Vegetation health and soil moisture analysis
- **Cyclone Tracking** - Hurricane/cyclone path prediction
- **Landslide Risk** - Slope and saturation-based risk zones

---

## 🏗️ Architecture

```
multi-satellite-data-fusion/
├── backend/              # Python FastAPI server
│   ├── main.py          # Main API application
│   ├── services/        # Business logic modules
│   │   ├── environmental.py    # NDWI, DEM, risk algorithms
│   │   ├── satellite.py        # Satellite tracking & telemetry
│   │   └── ai_insights.py      # Gemini AI integration
│   ├── models/          # Database models (SQLAlchemy)
│   ├── data/            # Satellite data storage
│   ├── requirements.txt
│   └── .env.example
├── frontend/            # React TypeScript SPA
│   ├── src/
│   │   ├── components/  # React components
│   │   │   ├── Dashboard.tsx
│   │   │   ├── SatelliteMap.tsx
│   │   │   ├── TelemetryPanel.tsx
│   │   │   ├── AlertsPanel.tsx
│   │   │   └── MetricsPanel.tsx
│   │   ├── lib/         # API client & utilities
│   │   ├── types/       # TypeScript type definitions
│   │   └── App.tsx
│   ├── package.json
│   ├── vite.config.ts
│   └── tailwind.config.js
├── docs/                # Documentation
└── README.md
```

---

## 🚀 Quick Start

### Prerequisites

**Backend:**
- Python 3.9 or higher
- pip

**Frontend:**
- Node.js 18+ and npm

### Installation

#### 1. Clone or Navigate to Project
```bash
cd multi-satellite-data-fusion
```

#### 2. Setup Backend

```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# On macOS/Linux:
source venv/bin/activate
# On Windows:
# venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Copy environment template
cp .env.example .env

# Edit .env and add your API keys (optional for demo)
# nano .env  # or use any text editor
```

#### 3. Setup Frontend

```bash
cd ../frontend

# Install dependencies
npm install
```

### Running the Application

#### Start Backend (Terminal 1)
```bash
cd backend
source venv/bin/activate  # Windows: venv\Scripts\activate
python main.py
```

The backend will start on **http://localhost:8000**

#### Start Frontend (Terminal 2)
```bash
cd frontend
npm run dev
```

The frontend will start on **http://localhost:3000**

#### Access the Dashboard
Open your browser to **http://localhost:3000**

---

## 📖 API Documentation

Once the backend is running, visit **http://localhost:8000/docs** for interactive API documentation.

### Key Endpoints

#### Environmental Monitoring
- `GET /api/environmental/risk` - Get risk analysis
  - Query params: `lat`, `lon`, `grid_size`

#### Satellite Tracking
- `GET /api/satellites` - List all tracked satellites
- `POST /api/satellites` - Add new satellite
- `DELETE /api/satellites/{id}` - Remove satellite
- `GET /api/satellites/telemetry` - Get all telemetry data
- `GET /api/satellites/passes` - Get pass predictions

#### Data Fusion
- `GET /api/fusion/metrics` - Get aggregated metrics

#### System
- `GET /api/health` - Health check
- `GET /` - API information

---

## ⚙️ Configuration

### Backend Environment Variables

Edit `backend/.env`:

```env
# Gemini AI API Key (optional - for AI insights)
GEMINI_API_KEY=your_gemini_api_key_here
ENABLE_AI_INSIGHTS=true

# N2YO Satellite API (optional)
N2YO_API_KEY=your_n2yo_api_key_here

# Server Configuration
BACKEND_PORT=8000
FRONTEND_PORT=3000

# CORS Origins
CORS_ORIGINS=http://localhost:3000,http://localhost:5173

# Database
DATABASE_URL=sqlite+aiosqlite:///./satellite_data.db
```

### Getting API Keys

**Gemini API (for AI insights):**
1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create a new API key
3. Add to `.env` file

**N2YO API (for real satellite data):**
1. Go to [N2YO.com](https://www.n2yo.com/api/)
2. Sign up for a free account
3. Add API key to `.env` file

**Note:** The system works with simulated data if no API keys are provided!

---

## 🎯 Usage Guide

### Satellite Tracking Mode
1. Click "Satellite Tracking" tab in the header
2. View real-time satellite positions on the map
3. Check telemetry panel for live data
4. Review fusion metrics in the sidebar

### Environmental Risk Mode
1. Click "Environmental Risk" tab
2. View risk zones highlighted on the map (RED/ORANGE/YELLOW)
3. Check alerts panel for detailed warnings
4. Read AI-generated insights and recommendations

### Adding Satellites
- Use the API directly: `POST /api/satellites`
- Or modify `backend/services/satellite.py` to add to DEFAULT_SATELLITES

---

## 🔬 Technology Stack

### Backend
- **FastAPI** - Modern Python web framework
- **NumPy** - Numerical computations
- **Shapely** - Geometric operations
- **scikit-image** - Image processing
- **Rasterio** - Geospatial raster data
- **Google Generative AI** - Gemini API integration
- **SQLAlchemy** - Database ORM
- **pystac-client** - STAC API client
- **Planetary Computer** - Microsoft satellite data

### Frontend
- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool
- **TailwindCSS** - Styling
- **Leaflet** - Interactive maps
- **React Leaflet** - React bindings for Leaflet
- **OpenStreetMap** - Map tiles
- **TanStack Query** - Data fetching
- **Recharts** - Data visualization
- **Lucide React** - Icon library
- **Sonner** - Toast notifications

---

## 📊 Data Sources

### Satellite Imagery
- **Microsoft Planetary Computer** - Sentinel-2 and Landsat data via STAC API
- **Synthetic Data** - Algorithmic generation for demos

### Satellite Tracking
- **Simulated Telemetry** - Lissajous curve orbital mechanics
- **N2YO API** - Optional real satellite tracking data

---

## 🧪 Development

### Running Tests
```bash
# Backend
cd backend
pytest

# Frontend
cd frontend
npm test
```

### Building for Production

**Backend:**
```bash
cd backend
pip install -r requirements.txt
python main.py
```

**Frontend:**
```bash
cd frontend
npm run build
npm run preview
```

---

## 🐛 Troubleshooting

### Backend won't start
- Check Python version: `python --version` (need 3.9+)
- Verify virtual environment is activated
- Install dependencies: `pip install -r requirements.txt`

### Frontend won't start
- Check Node version: `node --version` (need 18+)
- Delete `node_modules` and reinstall: `rm -rf node_modules && npm install`
- Clear cache: `npm cache clean --force`

### Map not loading
- Check browser console for errors
- Verify backend is running on port 8000
- Check CORS settings in backend

### Disaster layers not updating
- Check browser console for 404 errors on `/api/disaster/*` endpoints
- Verify backend has restarted after adding disaster_layers.py
- Check backend logs for Python errors

### No AI insights
- Verify `GEMINI_API_KEY` in `.env`
- Check API key is valid
- Set `ENABLE_AI_INSIGHTS=true`

---

## 📝 License

MIT License - feel free to use this project for any purpose!

---

## 🙏 Credits

This project merges the best features from three separate satellite monitoring systems:
1. **Environmental Risk Monitoring** - NDWI analysis and risk detection
2. **Multi-Satellite Data Fusion** - TypeScript dashboard with modern UI
3. **Satellite Command** - 3D visualization and pass predictions

---

## 🚀 Future Enhancements

- [ ] 3D Earth visualization
- [ ] Historical data trends and charts
- [ ] Email/SMS alert notifications
- [ ] Multi-user authentication
- [ ] Export data to CSV/GeoJSON
- [ ] Mobile app (React Native)
- [ ] Real-time WebSocket updates
- [ ] Integration with more satellite data sources

---

## 📞 Support

For issues or questions:
- Check the [API Documentation](http://localhost:8000/docs)
- Review this README
- Check terminal logs for errors

---

**Built with ❤️ combining Python FastAPI + React TypeScript**
