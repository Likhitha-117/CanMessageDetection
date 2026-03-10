import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from app.core.config import settings

async def cleanup():
    print(f"🔄 Connecting to MongoDB: {settings.MONGODB_URL}")
    client = AsyncIOMotorClient(settings.MONGODB_URL)
    db = client[settings.DATABASE_NAME]
    
    # 1. Remove prediction field if it's "Unknown" or null
    print("🔄 Removing 'Unknown' and null predictions...")
    
    # Update documents where prediction is "Unknown"
    res1 = await db.logs.update_many(
        {"prediction": "Unknown"},
        {"$unset": {"prediction": "", "confidence": ""}}
    )
    print(f"  Unset 'Unknown' in {res1.modified_count} logs.")

    # Update documents where prediction is None/null
    res2 = await db.logs.update_many(
        {"prediction": None},
        {"$unset": {"prediction": "", "confidence": ""}}
    )
    print(f"  Unset null prediction in {res2.modified_count} logs.")
    
    # 2. Final check
    counts = await db.logs.aggregate([
        {"$group": {"_id": {"$type": "$prediction"}, "count": {"$sum": 1}}}
    ]).to_list(length=100)
    print(f"Final Prediction Type Distribution: {counts}")
    
    client.close()
    print("✨ Cleanup complete.")

if __name__ == "__main__":
    asyncio.run(cleanup())
