from datetime import datetime
from typing import Optional
from beanie import Document
from pydantic import Field

class Feedback(Document):
    email: str
    type: str = "general" # 'bug', 'suggestion', 'general'
    message: str
    status: str = "open" # 'open', 'resolved'
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "feedback"
