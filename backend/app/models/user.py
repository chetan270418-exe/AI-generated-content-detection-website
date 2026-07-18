from datetime import datetime
from beanie import Document, Indexed
from pydantic import Field

class User(Document):
    email: Indexed(str, unique=True)
    hashed_password: str
    plan: str = "free_trial"
    trial_start: datetime = Field(default_factory=datetime.utcnow)
    analyses_count: int = 0
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "users"
