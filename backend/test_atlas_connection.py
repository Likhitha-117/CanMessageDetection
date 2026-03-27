import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

async def verify_connection():
    load_dotenv()
    
    mongodb_url = os.getenv("MONGODB_URL")
    db_name = os.getenv("DATABASE_NAME", "can_ids")
    
    print(f"Attempting to connect to: {mongodb_url.split('@')[-1] if '@' in mongodb_url else mongodb_url}")
    
    try:
        client = AsyncIOMotorClient(mongodb_url)
        # The ping command is cheap and does not require auth.
        await client.admin.command('ping')
        print("✅ Ping successful! Connected to MongoDB Atlas.")
        
        db = client[db_name]
        collections = await db.list_collection_names()
        print(f"✅ Successfully accessed database '{db_name}'.")
        print(f"Collections in '{db_name}': {collections}")
        
    except Exception as e:
        print(f"❌ Connection failed: {e}")
    finally:
        client.close()

if __name__ == "__main__":
    asyncio.run(verify_connection())
