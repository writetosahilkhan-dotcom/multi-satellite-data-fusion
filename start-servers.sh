#!/bin/bash

echo "🚀 Starting Unified Satellite Dashboard..."
echo ""

# Start backend
cd /Users/Sahil/Desktop/All/unified-satellite-dashboard/backend
echo "📡 Starting backend server on port 8000..."
nohup python3 main.py > backend.log 2>&1 &
BACKEND_PID=$!
echo "Backend PID: $BACKEND_PID"

# Wait for backend to start
sleep 3

# Start frontend
cd /Users/Sahil/Desktop/All/unified-satellite-dashboard/frontend
echo "🌐 Starting frontend server on port 3000..."
npm run dev &
FRONTEND_PID=$!
echo "Frontend PID: $FRONTEND_PID"

echo ""
echo "✅ Servers started!"
echo ""
echo "📱 Dashboard URL: http://localhost:3000"
echo "🔧 Backend API: http://localhost:8000"
echo "📚 API Docs: http://localhost:8000/docs"
echo ""
echo "Press Ctrl+C to stop the frontend, or run:"
echo "  kill $BACKEND_PID (to stop backend)"
echo ""

# Keep script running
wait $FRONTEND_PID
