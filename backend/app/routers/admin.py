from fastapi import APIRouter, Depends, HTTPException
from typing import List, Dict, Any
from ..models.user import User
from ..models.analysis import Analysis
from ..utils.jwt import get_current_user

router = APIRouter()

async def verify_admin(current_user: User = Depends(get_current_user)):
    # Since we don't have a role field officially migrated everywhere yet, 
    # we can check if their role is admin or if we want to hardcode an admin email
    # For now we'll assume the role field exists or default to "user"
    role = getattr(current_user, "role", "user")
    if role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return current_user

@router.get("/stats")
async def get_admin_stats(admin: User = Depends(verify_admin)) -> Dict[str, Any]:
    total_users = await User.count()
    vip_users = await User.find(User.plan == "vip").count()
    total_analyses = await Analysis.count()
    
    # Let's count verdicts
    ai_count = await Analysis.find(Analysis.verdict == "ai_generated").count()
    human_count = await Analysis.find(Analysis.verdict == "human_made").count()
    
    return {
        "total_users": total_users,
        "vip_users": vip_users,
        "total_analyses": total_analyses,
        "ai_count": ai_count,
        "human_count": human_count
    }

@router.get("/analyses")
async def get_global_analyses(admin: User = Depends(verify_admin)):
    # Get latest 50 analyses across all users
    analyses = await Analysis.find().sort(-Analysis.created_at).limit(50).to_list()
    
    # Map to simpler dicts and fetch user emails if needed (just IDs for now for speed)
    results = []
    for a in analyses:
        results.append({
            "id": str(a.id),
            "user_id": a.user_id,
            "file_type": a.file_type,
            "filename": a.original_filename or "Text Input",
            "verdict": a.verdict,
            "confidence_score": a.confidence_score,
            "status": a.status,
            "created_at": a.created_at
        })
    return results

@router.get("/users")
async def get_global_users(admin: User = Depends(verify_admin)):
    users = await User.find().sort(-User.created_at).limit(100).to_list()
    results = []
    for u in users:
        results.append({
            "id": str(u.id),
            "email": u.email,
            "plan": u.plan,
            "role": getattr(u, "role", "user"),
            "analyses_count": getattr(u, "analyses_count", 0),
            "created_at": u.created_at
        })
    return results
