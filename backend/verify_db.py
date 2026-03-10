import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from app.core.config import settings

async def check():
    client = AsyncIOMotorClient(settings.MONGODB_URL)
    db = client[settings.DATABASE_NAME]
    
    # Check logs
    print("--- Logs Statistics ---")
    cursor = db.logs.aggregate([
        {"$group": {"_id": {"$type": "$prediction"}, "count": {"$sum": 1}}}
    ])
    async for doc in cursor:
        print(f"Type: {doc['_id']}, Count: {doc['count']}")
        
    # Check distinct values
    preds = await db.logs.distinct("prediction")
    print(f"Distinct predictions: {preds}")
    
    # Check forensic_reports
    print("\n--- Forensic Reports Statistics ---")
    report_preds = await db.forensic_reports.distinct("prediction") # If it exists there
    print(f"Distinct report predictions: {report_preds}")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(check())
