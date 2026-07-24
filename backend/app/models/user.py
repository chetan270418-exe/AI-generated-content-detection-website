from datetime import datetime
from typing import Optional
from beanie import Document, Indexed
from pydantic import Field

class User(Document):
    email: Indexed(str, unique=True)
    hashed_password: str
    plan: str = "free_trial"
    trial_start: datetime = Field(default_factory=datetime.utcnow)
    analyses_count: int = 0
    role: str = "user"
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    # Email verification
    is_verified: bool = False
    otp_code: Optional[str] = None
    otp_expires_at: Optional[datetime] = None
    last_otp_sent_at: Optional[datetime] = None
    otp_failed_attempts: int = 0
    otp_locked_until: Optional[datetime] = None

    class Settings:
        name = "users"
