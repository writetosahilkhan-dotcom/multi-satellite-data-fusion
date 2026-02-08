#!/bin/bash
echo "Starting backend on port 8000..."
cd /Users/Sahil/Desktop/All/unified-satellite-dashboard/backend
python3 main.py > /tmp/backend.log 2>&1 &
echo $! > /tmp/backend.pid
echo "Backend PID: $(cat /tmp/backend.pid)"

sleep 3

echo "Starting frontend on port 3000..."
cd /Users/Sahil/Desktop/All/unified-satellite-dashboard/frontend  
npm run dev > /tmp/frontend.log 2>&1 &
echo $! > /tmp/frontend.pid
echo "Frontend PID: $(cat /tmp/frontend.pid)"

echo ""
echo "✅ Servers running!"
echo "Dashboard: http://localhost:3000"
echo "Backend API: http://localhost:8000"
echo ""
echo "To stop:"
echo "  kill \$(cat /tmp/backend.pid)"
echo "  kill \$(cat /tmp/frontend.pid)"
