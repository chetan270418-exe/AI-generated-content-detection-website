from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie
from .config import get_settings
from .models.user import User
from .models.analysis import Analysis
from .models.subscription import Subscription
from .models.feedback import Feedback

settings = get_settings()
client = None

async def init_db():
    global client
    client = AsyncIOMotorClient(settings.mongodb_uri)
    db = client[settings.mongodb_db_name]
    
    await init_beanie(database=db, document_models=[User, Analysis, Subscription, Feedback])
    print("Database initialized successfully.")
    
def close_db():
    if client:
        client.close()
