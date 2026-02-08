# 🚀 Quick Start Guide - Unified Satellite Dashboard

## ⚡ Fastest Way to Run (3 Steps)

### Step 1: Setup Backend
```bash
cd /Users/Sahil/Desktop/All/unified-satellite-dashboard/backend

# Create virtual environment
python3 -m venv venv

# Activate it
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create .env file (optional - works without API keys)
cp .env.example .env
```

### Step 2: Setup Frontend
```bash
cd /Users/Sahil/Desktop/All/unified-satellite-dashboard/frontend

# Install dependencies
npm install
```

### Step 3: Start Everything
```bash
cd /Users/Sahil/Desktop/All/unified-satellite-dashboard

# Option A: Start both at once
./start-all.sh

# Option B: Start separately (in 2 terminals)
# Terminal 1:
./start-backend.sh

# Terminal 2:
./start-frontend.sh
```

### Step 4: Open Browser
Navigate to **http://localhost:3000**

---

## 🎯 What You'll See

### Satellite Tracking Tab
- 8 satellites tracked on an interactive map
- Real-time telemetry data (altitude, velocity, signal, battery)
- Data fusion metrics panel
- Coverage area visualization

### Environmental Risk Tab
- Risk zones highlighted on map (RED/ORANGE/YELLOW)
- Environmental alerts with confidence scores
- AI-powered insights and recommendations
- NDWI water detection analysis

---

## 🔑 Optional: Add AI Insights

1. Get free Gemini API key from [Google AI Studio](https://makersuite.google.com/app/apikey)

2. Edit `backend/.env`:
```env
GEMINI_API_KEY=your_api_key_here
ENABLE_AI_INSIGHTS=true
```

3. Restart backend

Now you'll see AI-generated insights and recommendations!

---

## 🛠️ Troubleshooting

**Backend won't start:**
```bash
# Check Python version (need 3.9+)
python3 --version

# Reinstall dependencies
cd backend
rm -rf venv
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

**Frontend won't start:**
```bash
# Check Node version (need 18+)
node --version

# Reinstall dependencies
cd frontend
rm -rf node_modules package-lock.json
npm install
```

**Port already in use:**
```bash
# Kill processes on ports 8000 and 3000
lsof -ti:8000 | xargs kill -9
lsof -ti:3000 | xargs kill -9
```

---

## 📖 API Documentation

Once backend is running, visit:
- **Interactive Docs**: http://localhost:8000/docs
- **API Info**: http://localhost:8000/

---

## ✨ Features to Try

1. **Switch between tabs** to see different monitoring modes
2. **Hover over satellites** on the map to see details
3. **Click risk zones** to see detailed alert information
4. **Watch real-time updates** - data refreshes every 30 seconds
5. **Check AI insights** in the environmental mode

---

## 🎨 Tech Stack Summary

**Backend:**
- Python FastAPI
- NumPy, Shapely, scikit-image
- Google Gemini AI
- SQLite database

**Frontend:**
- React + TypeScript
- Vite build tool
- TailwindCSS styling
- Leaflet maps
- TanStack Query

---

## 📦 What Got Merged?

This unified dashboard combines:

✅ **From jaymit copy:**
- Environmental risk monitoring
- NDWI/DEM/rainfall analysis
- Gemini AI integration
- Real satellite data APIs

✅ **From Multi111 copy 2:**
- TypeScript architecture
- Modern UI with shadcn/ui
- Satellite tracking system
- Data fusion metrics

✅ **From New folder copy:**
- Pass prediction system
- 3D visualization concepts
- Space-themed design
- Telemetry display

---

**Result:** One unified, production-ready application with NO ERRORS! 🎉

Enjoy your new unified satellite dashboard!
