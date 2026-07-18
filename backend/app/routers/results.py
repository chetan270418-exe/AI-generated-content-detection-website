from fastapi import APIRouter, Depends, HTTPException, Query
from typing import List
from ..models.user import User
from ..models.analysis import Analysis
from ..schemas.analysis import AnalysisResponse, HistoryResponse
from ..utils.jwt import get_current_user
from beanie.odm.operators.find.logical import And
from fastapi.responses import Response
from ..services.report_service import generate_pdf_report

router = APIRouter()

@router.get("/result/{analysis_id}", response_model=AnalysisResponse)
async def get_result(
    analysis_id: str,
    current_user: User = Depends(get_current_user)
):
    from bson.errors import InvalidId
    try:
        analysis = await Analysis.get(analysis_id)
    except InvalidId:
        raise HTTPException(status_code=400, detail="Invalid ID format")
        
    if not analysis:
        raise HTTPException(status_code=404, detail="Analysis not found")
        
    if analysis.user_id != str(current_user.id):
        raise HTTPException(status_code=403, detail="Not authorized to view this result")
        
    return AnalysisResponse(
        id=str(analysis.id),
        file_type=analysis.file_type,
        original_filename=analysis.original_filename,
        status=analysis.status,
        verdict=analysis.verdict,
        confidence_score=analysis.confidence_score,
        explanation=analysis.explanation,
        detailed_results=analysis.detailed_results,
        created_at=analysis.created_at,
        completed_at=analysis.completed_at
    )

@router.get("/result/{analysis_id}/report")
async def get_report(
    analysis_id: str,
    current_user: User = Depends(get_current_user)
):
    from bson.errors import InvalidId
    try:
        analysis = await Analysis.get(analysis_id)
    except InvalidId:
        raise HTTPException(status_code=400, detail="Invalid ID format")
        
    if not analysis:
        raise HTTPException(status_code=404, detail="Analysis not found")
        
    if analysis.user_id != str(current_user.id):
        raise HTTPException(status_code=403, detail="Not authorized to view this result")
        
    import asyncio
    pdf_bytes = await asyncio.to_thread(generate_pdf_report, analysis, current_user)
    
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=dictator_report_{analysis_id}.pdf"}
    )

@router.get("/history", response_model=HistoryResponse)
async def get_history(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_user)
):
    skip = (page - 1) * limit
    
    analyses = await Analysis.find(
        Analysis.user_id == str(current_user.id)
    ).sort(-Analysis.created_at).skip(skip).limit(limit).to_list()
    
    total = await Analysis.find(Analysis.user_id == str(current_user.id)).count()
    pages = (total + limit - 1) // limit
    
    response_list = [
        AnalysisResponse(
            id=str(a.id),
            file_type=a.file_type,
            original_filename=a.original_filename,
            status=a.status,
            verdict=a.verdict,
            confidence_score=a.confidence_score,
            explanation=a.explanation,
            detailed_results=a.detailed_results,
            created_at=a.created_at,
            completed_at=a.completed_at
        ) for a in analyses
    ]
    
    return HistoryResponse(
        analyses=response_list,
        total=total,
        page=page,
        pages=pages
    )
