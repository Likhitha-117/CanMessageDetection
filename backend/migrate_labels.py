"""
Migration script to standardize labels in the database.
Converts numeric prediction labels (0, 1, 2, 3, 4) to string labels ("Normal", "DoS", etc.).
"""
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from app.core.config import settings
from app.core.class_labels import CLASS_LABELS, get_label

async def migrate_labels():
    print(f"🔄 Connecting to MongoDB: {settings.MONGODB_URL}")
    client = AsyncIOMotorClient(settings.MONGODB_URL)
    db = client[settings.DATABASE_NAME]
    
    # 1. Migrate logs collection
    print("🔄 Migrating 'logs' collection...")
    cursor = db.logs.find({"prediction": {"$exists": True}})
    count = 0
    async for doc in cursor:
        old_pred = doc.get("prediction")
        new_pred = get_label(old_pred)
        
        if old_pred != new_pred:
            await db.logs.update_one(
                {"_id": doc["_id"]},
                {"$set": {"prediction": new_pred}}
            )
            count += 1
            if count % 100 == 0:
                print(f"  Processed {count} log updates...")
    
    print(f"✅ Migrated {count} logs to string labels.")

    # 2. Add 'prediction' field to any log missing it (default to Normal if suspicious?)
    # Actually, better to set to "Unknown" if we can't be sure, but user says "Normal" is 0.
    # For now, let's just fix existing ones.
    
    # 3. Handle forensic_reports if any stored counts are wrong?
    # Based on analysis.py, it stores counts. If they were already calculated incorrectly, 
    # we might need to re-calculate, but the task says "convert existing records".
    # Since forensic_reports only store summary counts, we don't need to change the field values 
    # unless they are numeric, but they are already integers representing counts.
    
    client.close()
    print("✨ Migration complete.")

if __name__ == "__main__":
    asyncio.run(migrate_labels())
