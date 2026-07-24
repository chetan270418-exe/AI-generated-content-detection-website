from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect
from typing import List, Dict, Any
import json
import asyncio
import redis.asyncio as aioredis
from ..models.user import User
from ..models.analysis import Analysis
from ..models.feedback import Feedback
from ..models.cyber_report import CyberReport
from ..utils.jwt import get_current_user, verify_token
from ..config import get_settings

router = APIRouter()

# WebSocket Connection Manager
class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast(self, message: str):
        for connection in self.active_connections:
            try:
                await connection.send_text(message)
            except Exception:
                pass

manager = ConnectionManager()

# Background task to listen to Redis and broadcast to WebSockets
async def redis_listener():
    settings = get_settings()
    logged_once = False
    backoff = 5
    max_backoff = 300  # max 5 minutes between retries
    while True:
        try:
            redis_client = aioredis.from_url(settings.redis_url)
            pubsub = redis_client.pubsub()
            await pubsub.subscribe("admin_updates")
            
            if logged_once:
                print("Redis reconnected successfully.")
            logged_once = False
            backoff = 5
            
            async for message in pubsub.listen():
                if message["type"] == "message":
                    data = message["data"].decode("utf-8")
                    await manager.broadcast(data)
        except Exception as e:
            if not logged_once:
                print(f"Redis not available (admin websockets disabled): {e}")
                logged_once = True
            await asyncio.sleep(backoff)
            backoff = min(backoff * 2, max_backoff)
        finally:
            try:
                await pubsub.unsubscribe("admin_updates")
                await redis_client.close()
            except:
                pass

# Start the listener when module loads (safe — silently backs off if Redis is down)
_redis_listener_task = None
def start_redis_listener():
    global _redis_listener_task
    if _redis_listener_task is None:
        _redis_listener_task = asyncio.create_task(redis_listener())

async def verify_admin(current_user: User = Depends(get_current_user)):
    if current_user.role != "admin":
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
    # Only return users who have filed cyber reports
    reports = await CyberReport.find().to_list()
    reported_user_ids = {r.user_id for r in reports}
    
    if not reported_user_ids:
        return []
        
    from bson.objectid import ObjectId
    object_ids = [ObjectId(uid) for uid in reported_user_ids if uid]
    
    from beanie.odm.operators.find.comparison import In
    users = await User.find(In(User.id, object_ids)).sort(-User.created_at).to_list()
    
    results = []
    for u in users:
        results.append({
            "id": str(u.id),
            "email": u.email,
            "plan": u.plan,
            "role": u.role,
            "analyses_count": u.analyses_count,
            "created_at": u.created_at
        })
    return results

@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    token = websocket.query_params.get("token")
    if not token:
        await websocket.close(code=4401)
        return
        
    try:
        payload = verify_token(token)
        user_id = payload.get("sub")
        if not user_id:
            await websocket.close(code=4401)
            return
            
        user = await User.get(user_id)
        if not user or user.role != "admin":
            await websocket.close(code=4401)
            return
    except Exception:
        await websocket.close(code=4401)
        return

    await manager.connect(websocket)
    try:
        while True:
            # We just keep connection open, client doesn't send much
            data = await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)

@router.get("/feedback")
async def get_admin_feedback(admin: User = Depends(verify_admin)):
    feedbacks = await Feedback.find().sort(-Feedback.created_at).limit(100).to_list()
    results = []
    for f in feedbacks:
        results.append({
            "id": str(f.id),
            "email": f.email,
            "type": f.type,
            "message": f.message,
            "status": f.status,
            "created_at": f.created_at
        })
    return results

@router.put("/feedback/{feedback_id}/resolve")
async def resolve_feedback(feedback_id: str, admin: User = Depends(verify_admin)):
    from bson.objectid import ObjectId
    feedback = await Feedback.get(ObjectId(feedback_id))
    if not feedback:
        raise HTTPException(status_code=404, detail="Feedback not found")
        
    feedback.status = "resolved" if feedback.status == "open" else "open"
    await feedback.save()
    
    return {"message": "Feedback status updated", "status": feedback.status}

@router.get("/cyber-reports")
async def get_admin_cyber_reports(admin: User = Depends(verify_admin)):
    reports = await CyberReport.find().sort(-CyberReport.created_at).limit(100).to_list()
    results = []
    
    for r in reports:
        # fetch user email
        from bson.objectid import ObjectId
        user = await User.get(ObjectId(r.user_id))
        email = user.email if user else "Unknown User"
        
        results.append({
            "id": str(r.id),
            "user_email": email,
            "platform": r.platform,
            "category": r.category,
            "status": r.status,
            "created_at": r.created_at
        })
    return results
