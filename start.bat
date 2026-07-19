@echo off
echo ==========================================
echo Starting Dictator AI Detection Stack (Memory Optimized)
echo ==========================================

:: 1. Start Redis (Assuming it's running locally on standard port)
echo [1/3] Assuming Redis is running...

:: 2. Start Celery Worker with Memory Limits
:: -P threads: prevents process cloning which duplicates 3GB of RAM per CPU core
:: --concurrency=2: limits simultaneous inferences to prevent RAM spikes
echo [2/3] Starting Celery Worker (Low Memory Mode)...
start "Celery Worker" cmd /c "cd /d d:\AI-image-detection\backend && ..\.venv\Scripts\celery.exe -A app.tasks.celery_app worker --loglevel=info -P threads --concurrency=2"

:: 3. Start FastAPI Backend
:: It no longer pre-loads models, saving ~3GB of RAM
echo [3/3] Starting FastAPI Backend...
start "FastAPI Backend" cmd /c "cd /d d:\AI-image-detection\backend && ..\.venv\Scripts\python.exe -m uvicorn app.main:app --reload --port 8000"

:: 4. Start Next.js Frontend (Production Mode)
:: We run 'npm run build' and 'npm start' instead of 'dev' to save ~1.5GB of RAM
echo [4/3] Starting Frontend (Production)...
start "Next.js Frontend" cmd /c "cd /d d:\AI-image-detection\frontend && npm run build && npm start"

echo.
echo All services started! 
echo Frontend: http://localhost:3000
echo Backend API: http://localhost:8000
echo.
echo NOTE: Since we disabled aggressive preloading and are using INT8 quantized models, your RAM usage should be extremely low!
pause
