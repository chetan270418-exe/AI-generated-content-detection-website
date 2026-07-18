from beanie import Document
from pydantic import Field
from typing import Optional, List, Dict, Any
from datetime import datetime

class Subscription(Document):
    user_id: str = Field(index=True)
    plan: str = "vip"
    status: str = "active" # active, cancelled, expired, pending
    razorpay_order_id: Optional[str] = None
    razorpay_payment_id: Optional[str] = None
    razorpay_signature: Optional[str] = None
    amount: float
    currency: str = "INR"
    created_at: datetime = Field(default_factory=datetime.utcnow)
    expires_at: Optional[datetime] = None
    payment_history: List[Dict[str, Any]] = []

    class Settings:
        name = "subscriptions"
