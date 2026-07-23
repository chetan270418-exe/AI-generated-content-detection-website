import sys
import os

# Add project root to path so we can import from ml folder
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from .config import get_settings
from .database import init_db
from .routers import auth, analyze, results, subscription, admin

settings = get_settings()

app = FastAPI(
    title="Dictator API",
    description="API for AI Content Authenticity Detector",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_url],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

os.makedirs("uploads", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

@app.on_event("startup")
async def startup_event():
    await init_db()
    admin.start_redis_listener()
    
    # NOTE: We deliberately do NOT preload ML models here. 
    # FastAPI does not run inference; the Celery workers do.
    # Preloading here would duplicate the ~3GB model memory footprint.


app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(analyze.router, prefix="/api/analyze", tags=["analyze"])
app.include_router(results.router, prefix="/api", tags=["results"])
app.include_router(subscription.router, prefix="/api/subscription", tags=["subscription"])
app.include_router(admin.router, prefix="/api/admin", tags=["admin"])

@app.get("/health")
async def health_check():
    return {"status": "ok"}
