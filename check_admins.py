
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv

async def check_admins():
    load_dotenv("backend/.env")
    mongodb_url = os.getenv("MONGODB_URL")
    database_name = os.getenv("DATABASE_NAME", "can_ids")
    
    client = AsyncIOMotorClient(mongodb_url)
    db = client[database_name]
    
    admins = await db.users.find({"role": "admin"}).to_list(length=100)
    print(f"Found {len(admins)} admin(s):")
    for admin in admins:
        print(f" - ID: {admin['_id']}, Email: {admin['email']}, Name: {admin.get('full_name')}")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(check_admins())
