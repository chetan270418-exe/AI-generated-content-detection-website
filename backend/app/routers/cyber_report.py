from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import Response
from pydantic import BaseModel
import hashlib
from datetime import datetime
from ..models.user import User
from ..models.analysis import Analysis
from ..models.cyber_report import CyberReport
from ..utils.jwt import get_current_user
from ..services.cyber_report_service import generate_cyber_pdf

router = APIRouter()

class CyberReportSubmit(BaseModel):
    analysis_id: str
    platform: str
    category: str
    description: str

@router.post("/file")
async def file_cyber_report(data: CyberReportSubmit, current_user: User = Depends(get_current_user)):
    """
    File a new cyber crime report based on an existing analysis.
    """
    from bson.errors import InvalidId
    try:
        analysis = await Analysis.get(data.analysis_id)
    except InvalidId:
        raise HTTPException(status_code=400, detail="Invalid analysis ID format")
        
    if not analysis:
        raise HTTPException(status_code=404, detail="Analysis not found")
        
    # Prevent filing reports for non-AI content to avoid spam
    if analysis.verdict != "ai_generated":
        raise HTTPException(status_code=400, detail="Reports can only be filed for content detected as AI-generated.")
        
    # Generate an evidence hash
    hash_base = f"{current_user.id}|{analysis.id}|{data.platform}|{data.category}|{datetime.utcnow().isoformat()}"
    evidence_hash = hashlib.sha256(hash_base.encode('utf-8')).hexdigest()
    
    report = CyberReport(
        user_id=str(current_user.id),
        analysis_id=str(analysis.id),
        platform=data.platform,
        category=data.category,
        description=data.description,
        evidence_hash=evidence_hash
    )
    
    await report.insert()
    
    return {"message": "Report filed successfully", "report_id": str(report.id)}

@router.get("/{report_id}/pdf")
async def get_cyber_report_pdf(report_id: str, current_user: User = Depends(get_current_user)):
    """
    Generate and download the official PDF evidence for a filed report.
    """
    from bson.errors import InvalidId
    try:
        report = await CyberReport.get(report_id)
    except InvalidId:
        raise HTTPException(status_code=400, detail="Invalid report ID format")
        
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
        
    # Only the owner or an admin can download this PDF
    if report.user_id != str(current_user.id) and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized to access this report")
        
    analysis = await Analysis.get(report.analysis_id)
    if not analysis:
        raise HTTPException(status_code=404, detail="Associated analysis data is missing")
        
    # For the PDF, if the admin is downloading it, we still want to show the complainant's email
    complainant = current_user
    if report.user_id != str(current_user.id):
        from bson.objectid import ObjectId
        complainant = await User.get(ObjectId(report.user_id))
        
    import asyncio
    pdf_bytes = await asyncio.to_thread(generate_cyber_pdf, report, analysis, complainant)
    
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=cyber_evidence_{report_id}.pdf"}
    )
