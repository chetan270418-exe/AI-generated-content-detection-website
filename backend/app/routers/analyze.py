from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from typing import List
from datetime import datetime
from ..models.user import User
from ..models.analysis import Analysis
from ..schemas.analysis import TextAnalysisRequest
from ..utils.jwt import get_current_user
from ..services.file_service import save_upload

from ml.image_detector.predict import predict_image
from ml.text_detector.predict import predict_text
from ml.pdf_detector.predict import predict_pdf
from ml.video_detector.predict import predict_video

router = APIRouter()

async def check_quota(user: User):
    if user.plan == "free_trial":
        if user.analyses_count >= 50:
            raise HTTPException(
                status_code=403, 
                detail="Free trial limit reached (50 analyses). Please upgrade to VIP."
            )

@router.post("/image")
async def analyze_image(
    file: UploadFile = File(...), 
    current_user: User = Depends(get_current_user)
):
    await check_quota(current_user)
    
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")
        
    file_path = await save_upload(file, str(current_user.id))
    
    analysis = Analysis(
        user_id=str(current_user.id),
        file_type="image",
        original_filename=file.filename,
        file_path=file_path,
        status="processing"
    )
    await analysis.insert()
    
    current_user.analyses_count += 1
    await current_user.save()
    
    try:
        import asyncio
        # Run inference in a threadpool so we don't block the async event loop
        result = await asyncio.to_thread(predict_image, file_path)
        
        analysis.status = "completed"
        analysis.verdict = result.get("verdict")
        analysis.confidence_score = result.get("confidence")
        analysis.explanation = result.get("explanation")
        analysis.detailed_results = result.get("detailed_results")
        analysis.completed_at = datetime.utcnow()
        await analysis.save()
    except Exception as e:
        analysis.status = "failed"
        analysis.explanation = f"Analysis failed: {str(e)}"
        analysis.completed_at = datetime.utcnow()
        await analysis.save()
    
    return {"analysis_id": str(analysis.id), "status": analysis.status}

@router.post("/text")
async def analyze_text(
    request: TextAnalysisRequest,
    current_user: User = Depends(get_current_user)
):
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
    
    try:
        import asyncio
        # Run inference in a threadpool so we don't block the async event loop
        result = await asyncio.to_thread(predict_text, request.text)
        
        analysis.status = "completed"
        analysis.verdict = result.get("verdict")
        analysis.confidence_score = result.get("confidence")
        analysis.explanation = result.get("explanation")
        analysis.detailed_results = result.get("detailed_results")
        analysis.completed_at = datetime.utcnow()
        await analysis.save()
    except Exception as e:
        analysis.status = "failed"
        analysis.explanation = f"Analysis failed: {str(e)}"
        analysis.completed_at = datetime.utcnow()
        await analysis.save()
    
    return {"analysis_id": str(analysis.id), "status": analysis.status}

@router.post("/pdf")
async def analyze_pdf_file(
    file: UploadFile = File(...), 
    current_user: User = Depends(get_current_user)
):
    await check_quota(current_user)
    
    if file.content_type != "application/pdf":
        raise HTTPException(status_code=400, detail="File must be a PDF")
        
    file_path = await save_upload(file, str(current_user.id))
    
    analysis = Analysis(
        user_id=str(current_user.id),
        file_type="pdf",
        original_filename=file.filename,
        file_path=file_path,
        status="processing"
    )
    await analysis.insert()
    
    current_user.analyses_count += 1
    await current_user.save()
    
    try:
        import asyncio
        result = await asyncio.to_thread(predict_pdf, file_path)
        
        analysis.status = "completed"
        analysis.verdict = result.get("verdict")
        analysis.confidence_score = result.get("confidence")
        analysis.explanation = result.get("explanation")
        analysis.detailed_results = result.get("detailed_results")
        analysis.completed_at = datetime.utcnow()
        await analysis.save()
    except Exception as e:
        analysis.status = "failed"
        analysis.explanation = f"Analysis failed: {str(e)}"
        analysis.completed_at = datetime.utcnow()
        await analysis.save()
    
    return {"analysis_id": str(analysis.id), "status": analysis.status}

@router.post("/video")
async def analyze_video_file(
    file: UploadFile = File(...), 
    current_user: User = Depends(get_current_user)
):
    await check_quota(current_user)
    
    if not file.content_type.startswith("video/"):
        raise HTTPException(status_code=400, detail="File must be a video")
        
    file_path = await save_upload(file, str(current_user.id))
    
    analysis = Analysis(
        user_id=str(current_user.id),
        file_type="video",
        original_filename=file.filename,
        file_path=file_path,
        status="processing"
    )
    await analysis.insert()
    
    current_user.analyses_count += 1
    await current_user.save()
    
    try:
        import asyncio
        result = await asyncio.to_thread(predict_video, file_path)
        
        analysis.status = "completed"
        analysis.verdict = result.get("verdict")
        analysis.confidence_score = result.get("confidence")
        analysis.explanation = result.get("explanation")
        analysis.detailed_results = result.get("detailed_results")
        analysis.completed_at = datetime.utcnow()
        await analysis.save()
    except Exception as e:
        analysis.status = "failed"
        analysis.explanation = f"Analysis failed: {str(e)}"
        analysis.completed_at = datetime.utcnow()
        await analysis.save()
    
    return {"analysis_id": str(analysis.id), "status": analysis.status}

@router.post("/batch")
async def analyze_batch(
    files: List[UploadFile] = File(...), 
    current_user: User = Depends(get_current_user)
):
    if current_user.plan != "vip":
        raise HTTPException(status_code=403, detail="Batch upload is only available for VIP users.")
        
    if len(files) > 10:
        raise HTTPException(status_code=400, detail="Maximum 10 files allowed per batch.")
        
    analysis_ids = []
    
    # We will dispatch them asynchronously, wait for initial setup
    import asyncio
    
    async def process_single_file(file: UploadFile):
        file_path = await save_upload(file, str(current_user.id))
        
        file_type = "unknown"
        if file.content_type.startswith("image/"):
            file_type = "image"
        elif file.content_type == "application/pdf":
            file_type = "pdf"
        elif file.content_type.startswith("video/"):
            file_type = "video"
            
        if file_type == "unknown":
            return None
            
        analysis = Analysis(
            user_id=str(current_user.id),
            file_type=file_type,
            original_filename=file.filename,
            file_path=file_path,
            status="processing"
        )
        await analysis.insert()
        
        # Dispatch to thread
        def run_model():
            try:
                if file_type == "image":
                    from ml.image_detector.predict import predict_image
                    return predict_image(file_path)
                elif file_type == "pdf":
                    from ml.pdf_detector.predict import predict_pdf
                    return predict_pdf(file_path)
                elif file_type == "video":
                    from ml.video_detector.predict import predict_video
                    return predict_video(file_path)
            except Exception as e:
                return {"error": str(e)}

        async def complete_analysis():
            result = await asyncio.to_thread(run_model)
            if "error" in result:
                analysis.status = "failed"
                analysis.explanation = f"Analysis failed: {result['error']}"
            else:
                analysis.status = "completed"
                analysis.verdict = result.get("verdict")
                analysis.confidence_score = result.get("confidence")
                analysis.explanation = result.get("explanation")
                analysis.detailed_results = result.get("detailed_results")
            
            analysis.completed_at = datetime.utcnow()
            await analysis.save()
            
        # Fire and forget
        asyncio.create_task(complete_analysis())
        
        return str(analysis.id)
        
    results = await asyncio.gather(*(process_single_file(f) for f in files))
    valid_ids = [r for r in results if r is not None]
    
    current_user.analyses_count += len(valid_ids)
    await current_user.save()
    
    return {"analysis_ids": valid_ids, "status": "processing"}
