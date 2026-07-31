import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient
from passlib.context import CryptContext
from dotenv import load_dotenv

# Load the AWS/Local .env file
load_dotenv()

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def get_password_hash(password):
    return pwd_context.hash(password)

async def create_admin():
    uri = os.environ.get("MONGODB_URI")
    db_name = os.environ.get("MONGODB_DB_NAME", "dictator")
    
    if not uri:
        print("❌ Error: MONGODB_URI is not set in .env")
        return

    print(f"Connecting to MongoDB database '{db_name}'...")
    client = AsyncIOMotorClient(uri)
    db = client[db_name]
    
    # Prompt for admin details
    print("\n--- Create Admin User ---")
    email = input("Admin Email: ").strip()
    name = input("Admin Full Name: ").strip()
    password = input("Admin Password: ").strip()
    
    if not email or not password:
        print("❌ Error: Email and password cannot be empty.")
        return
        
    # Check if user already exists
    existing_user = await db.User.find_one({"email": email})
    if existing_user:
        print(f"⚠️ User with email {email} already exists!")
        choice = input("Do you want to force upgrade them to Admin? (y/n): ")
        if choice.lower() == 'y':
            await db.User.update_one(
                {"email": email}, 
                {"$set": {"role": "admin", "is_admin": True}}
            )
            print(f"✅ User {email} is now an Admin!")
        return

    # Create new admin user matching Beanie Document schema
    admin_user = {
        "email": email,
        "full_name": name,
        "hashed_password": get_password_hash(password),
        "is_active": True,
        "role": "admin",
        "is_admin": True,
        "tokens": 1000,
        "subscription_plan": "pro"
    }
    
    await db.User.insert_one(admin_user)
    print(f"\n✅ Successfully created Admin user: {email}")

if __name__ == "__main__":
    asyncio.run(create_admin())
