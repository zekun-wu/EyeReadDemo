@echo off
REM GlimmerRead Development Setup Script for Windows

echo 🌟 Starting GlimmerRead Development Environment...

REM Check if .env exists
if not exist "backend\.env" (
    echo ⚠️  Environment file not found!
    echo 📝 Creating .env from example...
    copy "backend\env.example" "backend\.env"
    echo ✏️  Please edit backend\.env with your API keys before continuing
    echo 📖 You need:
    echo    - OPENAI_API_KEY (for GPT-4 Vision)
    echo    - AZURE_SPEECH_KEY (for text-to-speech)
    echo    - AZURE_SPEECH_REGION (for text-to-speech)
    pause
    exit /b 1
)

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Python is required but not installed
    pause
    exit /b 1
)

REM Check if Node.js is installed
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js is required but not installed
    pause
    exit /b 1
)

echo ✅ Prerequisites check passed

REM Start backend
echo 🚀 Starting backend server...
cd backend

REM Create virtual environment if it doesn't exist
if not exist "venv" (
    echo 📦 Creating Python virtual environment...
    python -m venv venv
)

REM Activate virtual environment
echo 🔄 Activating virtual environment...
call venv\Scripts\activate.bat

REM Install Python dependencies
echo 📦 Installing Python dependencies...
pip install -q -r requirements.txt

REM Start backend server
echo 🎯 Starting FastAPI server on port 8000...
start "GlimmerRead Backend" cmd /k "uvicorn main:app --reload --host 0.0.0.0 --port 8000"

REM Go back to root directory
cd ..

REM Start frontend
echo 🎨 Starting frontend server...
cd frontend

REM Install Node dependencies if node_modules doesn't exist
if not exist "node_modules" (
    echo 📦 Installing Node.js dependencies...
    npm install
)

REM Start frontend server
echo 🌐 Starting React server on port 3000...
start "GlimmerRead Frontend" cmd /k "npm start"

REM Go back to root directory
cd ..

echo.
echo 🎉 GlimmerRead is now running!
echo.
echo 📱 Frontend: http://localhost:3000
echo 🔧 Backend API: http://localhost:8000
echo 📖 API Docs: http://localhost:8000/docs
echo.
echo 💡 Tips:
echo    - Upload a picture book page to test the system
echo    - Check the browser console for any errors
echo    - Both servers are running in separate windows
echo.
echo 🛑 Close the server windows to stop the application
pause
