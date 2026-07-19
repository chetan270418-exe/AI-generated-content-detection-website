import asyncio
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

    email = "admin@dictator.ai"
    user = await User.find_one(User.email == email)
    if not user:
        user = User(
            email=email,
            hashed_password=hash_password("admin123"),
            plan="vip",
            trial_start=datetime.utcnow()
        )
    
    # Python's dynamic attributes or Beanie might not store 'role' if it's not defined in the model.
    # Wait, earlier I saw: getattr(current_user, "role", "user")
    # Let's check if role exists in User model. We can just use the underlying dictionary or motor if Beanie strips it.
    
    # If the model does not have role, Beanie will discard extra fields. 
    # Let's check the User model first or just use raw pymongo.
    db = client[settings.mongodb_db_name]
    
    if not user.id:
        await user.insert()
        print("Created new admin user.")
    
    # Force update the role field in MongoDB directly just in case Beanie doesn't support extra fields
    await db["users"].update_one(
        {"email": email},
        {"$set": {"role": "admin"}}
    )
    print("Admin user created/updated successfully!")
    print("Email: admin@dictator.ai")
    print("Password: admin123")

if __name__ == "__main__":
    asyncio.run(main())
