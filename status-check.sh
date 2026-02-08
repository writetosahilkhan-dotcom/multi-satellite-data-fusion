#!/bin/bash
# Quick Status Check for Unified Satellite Dashboard

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  🛰️  UNIFIED SATELLITE DASHBOARD - STATUS CHECK"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Check Backend
echo "📡 Backend (FastAPI):"
if curl -s http://localhost:8000/health > /dev/null 2>&1; then
    echo "   ✅ Running on http://localhost:8000"
    echo "   📄 API Docs: http://localhost:8000/docs"
else
    echo "   ❌ Not running on port 8000"
fi
echo ""

# Check Frontend
echo "🌐 Frontend (React + Vite):"
if curl -s http://localhost:3000 > /dev/null 2>&1; then
    echo "   ✅ Running on http://localhost:3000"
else
    echo "   ❌ Not running on port 3000"
fi
echo ""

# Check Processes
echo "🔍 Running Processes:"
BACKEND_PID=$(lsof -ti:8000 2>/dev/null)
FRONTEND_PID=$(lsof -ti:3000 2>/dev/null)

if [ ! -z "$BACKEND_PID" ]; then
    echo "   Backend PID: $BACKEND_PID"
fi

if [ ! -z "$FRONTEND_PID" ]; then
    echo "   Frontend PID: $FRONTEND_PID"
fi
echo ""

# Test Key Endpoints
echo "🧪 Testing Key Endpoints:"

# ISRO Satellites
if curl -s http://localhost:8000/api/isro/satellites | grep -q "CARTOSAT"; then
    echo "   ✅ ISRO Satellites"
else
    echo "   ⚠️  ISRO Satellites endpoint issue"
fi

# Data Fusion
if curl -s -X POST http://localhost:8000/api/data/fuse -H "Content-Type: application/json" -d '{"datasets":["test"]}' | grep -q "success"; then
    echo "   ✅ Data Fusion"
else
    echo "   ⚠️  Data Fusion endpoint issue"
fi

# Environmental Risk
if curl -s "http://localhost:8000/api/environmental/risk?lat=26.0&lon=92.0&radius=50000" | grep -q "riskScore"; then
    echo "   ✅ Environmental Risk"
else
    echo "   ⚠️  Environmental Risk endpoint issue"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  📊 FEATURES INTEGRATED"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "  ✅ Environmental Risk Monitoring (jaymit copy)"
echo "     • NDVI/NDWI calculations"
echo "     • Real satellite data (Sentinel-2, Landsat)"
echo "     • DEM terrain analysis"
echo ""
echo "  ✅ 3D Orbital Visualization (New folder copy)"
echo "     • Interactive 3D Earth view"
echo "     • Satellite constellation display"
echo "     • Zoom & rotation controls"
echo ""
echo "  ✅ ISRO Integration (Multi111 copy 2)"
echo "     • CARTOSAT-3, ResourceSat-2A, RISAT-2B"
echo "     • OCEANSAT-3, EOS-06"
echo "     • Indian satellite data"
echo ""
echo "  ✅ Data Fusion (Multi111 copy 2)"
echo "     • Multi-satellite fusion"
echo "     • Confidence metrics"
echo "     • Quality improvement analytics"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  🎯 ACCESS POINTS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "  Dashboard:     http://localhost:3000"
echo "  API Docs:      http://localhost:8000/docs"
echo "  Health Check:  http://localhost:8000/health"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
