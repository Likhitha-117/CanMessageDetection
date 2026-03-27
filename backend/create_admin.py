import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv
from app.core.security import hash_password
from datetime import datetime, timezone

async def create_admin():
    load_dotenv()
    mongodb_url = os.getenv("MONGODB_URL")
    db_name = os.getenv("DATABASE_NAME", "can_ids")
    
    if not mongodb_url:
        print("❌ MONGODB_URL not found in .env")
        return

    print(f"Connecting to {mongodb_url.split('@')[-1]}...")
    client = AsyncIOMotorClient(mongodb_url)
    db = client[db_name]
    
    email = input("Enter Admin Email: ")
    password = input("Enter Admin Password: ")
    full_name = input("Enter Admin Full Name: ")
    
    existing = await db.users.find_one({"email": email})
    if existing:
        print(f"❌ User with email {email} already exists.")
        return
        
    admin_doc = {
        "full_name": full_name,
        "email": email,
        "password": hash_password(password),
        "role": "admin",
        "approved": True,
        "created_at": datetime.now(timezone.utc),
    }
    
    try:
        await db.users.insert_one(admin_doc)
        print(f"✅ Admin {email} created and approved successfully!")
    except Exception as e:
        print(f"❌ Failed to create admin: {e}")
    finally:
        client.close()

if __name__ == "__main__":
    asyncio.run(create_admin())
