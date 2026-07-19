import redis.asyncio as aioredis
import json
from ..config import get_settings

async def publish_admin_event(event_type: str, payload: dict):
    """
    Publishes an event to the 'admin_updates' Redis channel so the 
    WebSocket manager in the admin router can broadcast it to clients.
    """
    try:
        settings = get_settings()
        redis_client = aioredis.from_url(settings.redis_url)
        message = json.dumps({
            "event": event_type,
            "data": payload
        })
        await redis_client.publish("admin_updates", message)
        await redis_client.close()
    except Exception:
        # Silently pass if Redis is not running. 
        # This is just for admin websockets and does not affect core ML functionality.
        pass
