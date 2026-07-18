from datetime import datetime
from typing import Optional, Dict, Any
from beanie import Document
from pydantic import Field, BaseModel

class Analysis(Document):
    user_id: str  # Store string representation of ObjectId to avoid import issues
    file_type: str  # image, text, pdf, video
    original_filename: Optional[str] = None
    file_path: Optional[str] = None
    input_text: Optional[str] = None
    status: str = "pending"  # pending, processing, completed, failed
    verdict: Optional[str] = None
    confidence_score: Optional[float] = None
    explanation: Optional[str] = None
    detailed_results: Optional[Dict[str, Any]] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    completed_at: Optional[datetime] = None

    class Settings:
        name = "analyses"
