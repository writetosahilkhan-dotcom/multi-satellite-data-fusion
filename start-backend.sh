#!/bin/bash

echo "🛰️  Starting Unified Satellite Dashboard Backend"
echo "================================================"

# Navigate to backend directory
cd "$(dirname "$0")/backend"

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
echo "Activating virtual environment..."
source venv/bin/activate

# Install dependencies if needed
if [ ! -f "venv/.installed" ]; then
    echo "Installing dependencies..."
    pip install -r requirements.txt
    touch venv/.installed
fi

# Start server
echo "Starting FastAPI server on http://localhost:8000"
echo "API Docs: http://localhost:8000/docs"
echo "================================================"
python main.py
