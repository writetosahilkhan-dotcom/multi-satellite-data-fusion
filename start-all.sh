#!/bin/bash

echo "🚀 Starting Unified Satellite Dashboard"
echo "========================================"
echo ""
echo "This will start both backend and frontend servers."
echo "Backend: http://localhost:8000"
echo "Frontend: http://localhost:3000"
echo ""
echo "Press Ctrl+C to stop all servers"
echo "========================================"
echo ""

# Get the directory where the script is located
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

# Start backend in background
echo "Starting backend..."
"$SCRIPT_DIR/start-backend.sh" &
BACKEND_PID=$!

# Wait a bit for backend to start
sleep 3

# Start frontend in background
echo "Starting frontend..."
"$SCRIPT_DIR/start-frontend.sh" &
FRONTEND_PID=$!

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "Stopping servers..."
    kill $BACKEND_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    echo "Servers stopped."
    exit 0
}

# Set up trap to catch Ctrl+C
trap cleanup INT TERM

# Wait for both processes
wait
