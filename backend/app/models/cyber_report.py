from datetime import datetime
from beanie import Document
from pydantic import Field

class CyberReport(Document):
    user_id: str
    analysis_id: str
    platform: str
    category: str
    description: str
    status: str = "filed" # 'filed', 'reviewed', 'action_taken'
    evidence_hash: str
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "cyber_reports"
