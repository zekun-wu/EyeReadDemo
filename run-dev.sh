#!/bin/bash

# GlimmerRead Development Setup Script

echo "🌟 Starting GlimmerRead Development Environment..."

# Check if .env exists
if [ ! -f "backend/.env" ]; then
    echo "⚠️  Environment file not found!"
    echo "📝 Creating .env from example..."
    cp backend/env.example backend/.env
    echo "✏️  Please edit backend/.env with your API keys before continuing"
    echo "📖 You need:"
    echo "   - OPENAI_API_KEY (for GPT-4 Vision)"
    echo "   - AZURE_SPEECH_KEY (for text-to-speech)"
    echo "   - AZURE_SPEECH_REGION (for text-to-speech)"
    exit 1
fi

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check prerequisites
echo "🔍 Checking prerequisites..."

if ! command_exists python3; then
    echo "❌ Python 3 is required but not installed"
    exit 1
fi

if ! command_exists node; then
    echo "❌ Node.js is required but not installed"
    exit 1
fi

if ! command_exists npm; then
    echo "❌ npm is required but not installed"
    exit 1
fi

echo "✅ Prerequisites check passed"

# Start backend
echo "🚀 Starting backend server..."
cd backend

# Create virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    echo "📦 Creating Python virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
echo "🔄 Activating virtual environment..."
source venv/bin/activate

# Install Python dependencies
echo "📦 Installing Python dependencies..."
pip install -q -r requirements.txt

# Start backend server in background
echo "🎯 Starting FastAPI server on port 8000..."
uvicorn main:app --reload --host 0.0.0.0 --port 8000 &
BACKEND_PID=$!

# Go back to root directory
cd ..

# Start frontend
echo "🎨 Starting frontend server..."
cd frontend

# Install Node dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "📦 Installing Node.js dependencies..."
    npm install
fi

# Start frontend server
echo "🌐 Starting React server on port 3000..."
npm start &
FRONTEND_PID=$!

# Go back to root directory
cd ..

# Wait a moment for servers to start
sleep 3

echo ""
echo "🎉 GlimmerRead is now running!"
echo ""
echo "📱 Frontend: http://localhost:3000"
echo "🔧 Backend API: http://localhost:8000"
echo "📖 API Docs: http://localhost:8000/docs"
echo ""
echo "💡 Tips:"
echo "   - Upload a picture book page to test the system"
echo "   - Check the browser console for any errors"
echo "   - Backend logs will appear in this terminal"
echo ""
echo "🛑 To stop the servers, press Ctrl+C"

# Function to handle cleanup on exit
cleanup() {
    echo ""
    echo "🧹 Cleaning up..."
    if kill -0 $BACKEND_PID 2>/dev/null; then
        echo "   Stopping backend server..."
        kill $BACKEND_PID
    fi
    if kill -0 $FRONTEND_PID 2>/dev/null; then
        echo "   Stopping frontend server..."
        kill $FRONTEND_PID
    fi
    echo "👋 Goodbye!"
}

# Set up trap to handle Ctrl+C
trap cleanup INT

# Wait for processes
wait $BACKEND_PID $FRONTEND_PID
