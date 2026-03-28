
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv

async def cleanup_admins():
    load_dotenv("backend/.env")
    mongodb_url = os.getenv("MONGODB_URL")
    database_name = os.getenv("DATABASE_NAME", "can_ids")
    
    client = AsyncIOMotorClient(mongodb_url)
    db = client[database_name]
    
    admins = await db.users.find({"role": "admin"}).sort("created_at", 1).to_list(length=100)
    
    if len(admins) <= 1:
        print("No duplicate admins found.")
        return

    print(f"Found {len(admins)} admins. Keeping the oldest one: {admins[0]['email']}")
    
    to_remove = admins[1:]
    for admin in to_remove:
        print(f"Removing duplicate admin: {admin['email']} (ID: {admin['_id']})")
        await db.users.delete_one({"_id": admin["_id"]})
    
    print("Cleanup complete.")
    client.close()

if __name__ == "__main__":
    asyncio.run(cleanup_admins())
