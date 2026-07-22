import asyncio
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from typing import List, Any
from datetime import datetime
from ..models.user import User
from ..models.analysis import Analysis
from ..schemas.analysis import TextAnalysisRequest
from ..utils.jwt import get_current_user
from ..services.file_service import save_bytes
from ..utils.pubsub import publish_admin_event
from ..utils.file_validation import detect_category
from ..config import get_settings

from ml.image_detector.predict import predict_image
from ml.text_detector.predict import predict_text
from ml.pdf_detector.predict import predict_pdf
from ml.video_detector.predict import predict_video
from ml.audio_detector.predict import predict_audio

router = APIRouter()
settings = get_settings()

PREDICTORS = {
    "image": predict_image,
    "pdf": predict_pdf,
    "video": predict_video,
    "audio": predict_audio
}

async def check_quota(user: User):
    if user.plan == "free_trial":
        if user.analyses_count >= 20:
            raise HTTPException(
                status_code=403, 
                detail="Free trial limit reached (20 analyses). Please upgrade to VIP."
            )

async def _read_and_validate(file: UploadFile, expected_category: str, current_user: User) -> bytes:
    content = await file.read()
    
    max_mb = 50 if current_user.plan == "vip" else 10
    max_size_bytes = max_mb * 1024 * 1024
    if len(content) > max_size_bytes:
        raise HTTPException(status_code=413, detail=f"File exceeds maximum size of {max_mb}MB for your plan.")
        
    actual_category = detect_category(content)
    if actual_category != expected_category:
        article = "an" if expected_category.startswith(('a', 'e', 'i', 'o', 'u')) else "a"
        raise HTTPException(
            status_code=400, 
            detail=f"File must be {article} {expected_category} (its content doesn't match a recognized {expected_category} signature)."
        )
    return content

async def _complete_analysis(analysis: Analysis, predict_fn, predict_arg: Any):
    try:
        result = await asyncio.to_thread(predict_fn, predict_arg)
        
        analysis.status = "completed"
        analysis.verdict = result.get("verdict")
        analysis.confidence_score = result.get("confidence")
        analysis.explanation = result.get("explanation")
        analysis.detailed_results = result.get("detailed_results")
        analysis.completed_at = datetime.utcnow()
        await analysis.save()
        
        await publish_admin_event("analysis_completed", {
            "id": str(analysis.id),
            "file_type": analysis.file_type,
            "verdict": analysis.verdict,
            "status": "completed"
        })
    except Exception as e:
        analysis.status = "failed"
        analysis.explanation = f"Analysis failed: {str(e)}"
        analysis.completed_at = datetime.utcnow()
        await analysis.save()

async def _run_file_analysis(file: UploadFile, file_type: str, current_user: User):
    await check_quota(current_user)
    content = await _read_and_validate(file, file_type, current_user)
    file_path = await save_bytes(content, file.filename, str(current_user.id))
    
    analysis = Analysis(
        user_id=str(current_user.id),
        file_type=file_type,
        original_filename=file.filename,
        file_path=file_path,
        status="processing"
    )
    await analysis.insert()
    
    current_user.analyses_count += 1
    await current_user.save()
    
    # Run the completion logic
    await _complete_analysis(analysis, PREDICTORS[file_type], file_path)
    
    return {"analysis_id": str(analysis.id), "status": analysis.status}

@router.post("/image")
async def analyze_image(file: UploadFile = File(...), current_user: User = Depends(get_current_user)):
    return await _run_file_analysis(file, "image", current_user)

@router.post("/pdf")
async def analyze_pdf(file: UploadFile = File(...), current_user: User = Depends(get_current_user)):
    if current_user.plan != "vip":
        raise HTTPException(status_code=403, detail="Please upgrade to VIP to analyze PDFs.")
    return await _run_file_analysis(file, "pdf", current_user)

@router.post("/video")
async def analyze_video(file: UploadFile = File(...), current_user: User = Depends(get_current_user)):
    if current_user.plan != "vip":
        raise HTTPException(status_code=403, detail="Please upgrade to VIP to analyze Videos.")
    return await _run_file_analysis(file, "video", current_user)

@router.post("/audio")
async def analyze_audio(file: UploadFile = File(...), current_user: User = Depends(get_current_user)):
    if current_user.plan != "vip":
        raise HTTPException(status_code=403, detail="Please upgrade to VIP to analyze Audio files.")
    return await _run_file_analysis(file, "audio", current_user)

@router.post("/text")
async def analyze_text(request: TextAnalysisRequest, current_user: User = Depends(get_current_user)):
    await check_quota(current_user)
    
    analysis = Analysis(
        user_id=str(current_user.id),
        file_type="text",
        input_text=request.text,
        status="processing"
    )
    await analysis.insert()
    
    current_user.analyses_count += 1
    await current_user.save()
    
    await _complete_analysis(analysis, predict_text, request.text)
    
    return {"analysis_id": str(analysis.id), "status": analysis.status}

@router.post("/batch")
async def analyze_batch(files: List[UploadFile] = File(...), current_user: User = Depends(get_current_user)):
    if current_user.plan != "vip":
        raise HTTPException(status_code=403, detail="Batch upload is only available for VIP users.")
        
    if len(files) > 10:
        raise HTTPException(status_code=400, detail="Maximum 10 files allowed per batch.")
        
    analysis_ids = []
    
    async def process_single_file(file: UploadFile):
        content = await file.read()
        
        max_mb = 50 if current_user.plan == "vip" else 10
        max_size_bytes = max_mb * 1024 * 1024
        if len(content) > max_size_bytes:
            return None
            
        file_type = detect_category(content)
        if not file_type:
            return None
            
        file_path = await save_bytes(content, file.filename, str(current_user.id))
        
        analysis = Analysis(
            user_id=str(current_user.id),
            file_type=file_type,
            original_filename=file.filename,
            file_path=file_path,
            status="processing"
        )
        await analysis.insert()
        
        # Fire and forget
        asyncio.create_task(_complete_analysis(analysis, PREDICTORS[file_type], file_path))
        return str(analysis.id)
        
    results = await asyncio.gather(*(process_single_file(f) for f in files))
    valid_ids = [r for r in results if r is not None]
    
    current_user.analyses_count += len(valid_ids)
    await current_user.save()
    
    return {"analysis_ids": valid_ids, "status": "processing"}
