import sys
import os

# Add project root to path so we can import from ml folder
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
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

@app.on_event("startup")
async def startup_event():
    await init_db()
    
    # Pre-load ML models so the first user doesn't experience a cold start
    import asyncio
    from ml.image_detector.model import ImageDetectorModel
    from ml.text_detector.model import TextDetectorModel
    
    try:
        await asyncio.to_thread(ImageDetectorModel().load)
        await asyncio.to_thread(TextDetectorModel().load)
    except Exception as e:
        print(f"Warning: Failed to pre-load models (maybe not exported yet?): {e}")

app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(analyze.router, prefix="/api/analyze", tags=["analyze"])
app.include_router(results.router, prefix="/api", tags=["results"])
app.include_router(subscription.router, prefix="/api/subscription", tags=["subscription"])
app.include_router(admin.router, prefix="/api/admin", tags=["admin"])

@app.get("/health")
async def health_check():
    return {"status": "ok"}
