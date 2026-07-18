from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List
from datetime import datetime

class TextAnalysisRequest(BaseModel):
    text: str = Field(..., max_length=10000)

class AnalysisResponse(BaseModel):
    id: str
    file_type: str
    original_filename: Optional[str] = None
    status: str
    verdict: Optional[str] = None
    confidence_score: Optional[float] = None
    explanation: Optional[str] = None
    detailed_results: Optional[Dict[str, Any]] = None
    created_at: datetime
    completed_at: Optional[datetime] = None

class HistoryResponse(BaseModel):
    analyses: List[AnalysisResponse]
    total: int
    page: int
    pages: int
