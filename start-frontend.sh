#!/bin/bash

echo "🎨 Starting Unified Satellite Dashboard Frontend"
echo "================================================"

# Navigate to frontend directory
cd "$(dirname "$0")/frontend"

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
fi

# Start development server
echo "Starting Vite dev server on http://localhost:3000"
echo "================================================"
npm run dev
