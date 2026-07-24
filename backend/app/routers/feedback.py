from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from ..models.user import User
from ..models.feedback import Feedback
from ..utils.jwt import get_current_user

router = APIRouter()

class FeedbackSubmitRequest(BaseModel):
    type: str
    message: str

@router.post("/submit")
async def submit_feedback(data: FeedbackSubmitRequest, current_user: User = Depends(get_current_user)):
    """
    Submit feedback. Requires authentication.
    """
    if not data.message.strip():
        raise HTTPException(status_code=400, detail="Message cannot be empty")
        
    feedback = Feedback(
        email=current_user.email,
        type=data.type,
        message=data.message,
        status="open"
    )
    
    await feedback.insert()
    
    return {"message": "Feedback submitted successfully. Thank you!"}
