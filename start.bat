@echo off
echo Starting Attention-Augmented LSTM RSS App
echo ==========================================

REM Start the Python inference server in a new window
start "LSTM Inference Server" cmd /k "python -m uvicorn inference_server:app --host 0.0.0.0 --port 8000"

REM Give the server a moment to load the model (~5-10s on GPU)
echo Waiting for inference server to load model...
timeout /t 10 /nobreak >nul

REM Start the Next.js dev server
cd rss-app
start "RSS Next.js App" cmd /k "npm run dev"

echo.
echo Both servers are starting:
echo   Inference API : http://localhost:8000
echo   Health check  : http://localhost:8000/health
echo   RSS Dashboard : http://localhost:3000
