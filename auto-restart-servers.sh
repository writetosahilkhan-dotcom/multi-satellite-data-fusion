#!/bin/bash

# Auto-restart script for COSMOS Satellite Dashboard
# Monitors and automatically restarts backend and frontend if they crash

echo "🚀 Starting COSMOS Satellite Dashboard with auto-restart..."

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Get the directory of the script
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
BACKEND_DIR="$DIR/backend"
FRONTEND_DIR="$DIR/frontend"
VENV_PATH="/Users/Sahil/Desktop/All/.venv"

# Log files
BACKEND_LOG="$DIR/backend-auto.log"
FRONTEND_LOG="$DIR/frontend-auto.log"
MONITOR_LOG="$DIR/monitor.log"

# PID files
BACKEND_PID="$DIR/backend-auto.pid"
FRONTEND_PID="$DIR/frontend-auto.pid"

# Cleanup function
cleanup() {
    echo -e "\n${YELLOW}Shutting down servers...${NC}"
    if [ -f "$BACKEND_PID" ]; then
        BPID=$(cat "$BACKEND_PID")
        kill -9 "$BPID" 2>/dev/null
        rm -f "$BACKEND_PID"
    fi
    if [ -f "$FRONTEND_PID" ]; then
        FPID=$(cat "$FRONTEND_PID")
        kill -9 "$FPID" 2>/dev/null
        rm -f "$FRONTEND_PID"
    fi
    pkill -P $$ 2>/dev/null
    echo -e "${GREEN}Cleanup complete${NC}"
    exit 0
}

trap cleanup SIGINT SIGTERM

# Function to kill process on port
kill_port() {
    local port=$1
    lsof -ti:"$port" | xargs kill -9 2>/dev/null
}

# Function to start backend
start_backend() {
    # Kill any process on port 8000
    kill_port 8000
    echo -e "${YELLOW}[$(date '+%H:%M:%S')] Starting backend...${NC}" | tee -a "$MONITOR_LOG"
    cd "$BACKEND_DIR"
    source "$VENV_PATH/bin/activate"
    nohup uvicorn main:app --reload --host 0.0.0.0 --port 8000 > "$BACKEND_LOG" 2>&1 &
    echo $! > "$BACKEND_PID"
    echo -e "${GREEN}[$(date '+%H:%M:%S')] Backend started (PID: $(cat $BACKEND_PID))${NC}" | tee -a "$MONITOR_LOG"
    sleep 3
}

# Function to start frontend
start_frontend() {
    # Kill any process on port 3000
    kill_port 3000
    echo -e "${YELLOW}[$(date '+%H:%M:%S')] Starting frontend...${NC}" | tee -a "$MONITOR_LOG"
    cd "$FRONTEND_DIR"
    nohup npm run dev > "$FRONTEND_LOG" 2>&1 &
    echo $! > "$FRONTEND_PID"
    echo -e "${GREEN}[$(date '+%H:%M:%S')] Frontend started (PID: $(cat $FRONTEND_PID))${NC}" | tee -a "$MONITOR_LOG"
    sleep 3
}

# Function to check if process is running
is_running() {
    local pid=$1
    if [ -z "$pid" ]; then
        return 1
    fi
    if ps -p "$pid" > /dev/null 2>&1; then
        return 0
    else
        return 1
    fi
}

# Start both servers
start_backend
start_frontend

echo -e "\n${GREEN}════════════════════════════════════════════${NC}"
echo -e "${GREEN}  COSMOS Dashboard Running with Auto-Restart${NC}"
echo -e "${GREEN}════════════════════════════════════════════${NC}"
echo -e "Backend:  ${GREEN}http://localhost:8000${NC}"
echo -e "Frontend: ${GREEN}http://localhost:3000${NC}"
echo -e "\nLogs:"
echo -e "  Backend:  $BACKEND_LOG"
echo -e "  Frontend: $FRONTEND_LOG"
echo -e "  Monitor:  $MONITOR_LOG"
echo -e "\n${YELLOW}Press Ctrl+C to stop all servers${NC}\n"

# Monitoring loop
while true; do
    # Check backend
    if [ -f "$BACKEND_PID" ]; then
        BPID=$(cat "$BACKEND_PID")
        if ! is_running "$BPID"; then
            echo -e "${RED}[$(date '+%H:%M:%S')] Backend crashed! Restarting...${NC}" | tee -a "$MONITOR_LOG"
            start_backend
        fi
    else
        echo -e "${RED}[$(date '+%H:%M:%S')] Backend PID file missing! Restarting...${NC}" | tee -a "$MONITOR_LOG"
        start_backend
    fi

    # Check frontend
    if [ -f "$FRONTEND_PID" ]; then
        FPID=$(cat "$FRONTEND_PID")
        if ! is_running "$FPID"; then
            echo -e "${RED}[$(date '+%H:%M:%S')] Frontend crashed! Restarting...${NC}" | tee -a "$MONITOR_LOG"
            start_frontend
        fi
    else
        echo -e "${RED}[$(date '+%H:%M:%S')] Frontend PID file missing! Restarting...${NC}" | tee -a "$MONITOR_LOG"
        start_frontend
    fi

    # Check every 5 seconds
    sleep 5
done
