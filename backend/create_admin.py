import asyncio
import os
import secrets
from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie
from app.models.user import User
from app.models.analysis import Analysis
from app.config import get_settings
from app.utils.security import hash_password
from datetime import datetime

async def main():
    settings = get_settings()
    client = AsyncIOMotorClient(settings.mongodb_uri)
    await init_beanie(database=client[settings.mongodb_db_name], document_models=[User, Analysis])

    email = os.environ.get("ADMIN_EMAIL", "admin@dictator.ai")
    raw_password = os.environ.get("ADMIN_PASSWORD")
    
    user = await User.find_one(User.email == email)
    
    if not user:
        if not raw_password:
            raw_password = secrets.token_urlsafe(12)
            print(f"No ADMIN_PASSWORD provided. Generated random password: {raw_password}")
            
        user = User(
            email=email,
            hashed_password=hash_password(raw_password),
            plan="vip",
            trial_start=datetime.utcnow()
        )
    else:
        if raw_password:
            user.hashed_password = hash_password(raw_password)
            
    user.role = "admin"
    user.is_verified = True
    await user.save()
    
    print("Admin user created/updated successfully!")
    print(f"Email: {email}")

if __name__ == "__main__":
    asyncio.run(main())
