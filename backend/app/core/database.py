"""
MongoDB async connection using Motor.
"""
from motor.motor_asyncio import AsyncIOMotorClient
from .config import settings

client: AsyncIOMotorClient = None
db = None


async def connect_to_mongo():
    global client, db
    client = AsyncIOMotorClient(settings.MONGODB_URL)
    db = client[settings.DATABASE_NAME]

    # Create indexes
    await db.users.create_index("email", unique=True)
    await db.vehicles.create_index("vehicle_id", unique=True)
    await db.vehicles.create_index("vehicle_api_key", unique=True)
    await db.logs.create_index("vehicle_id")
    await db.logs.create_index("timestamp")
    await db.logs.create_index("prediction")
    print(f"✅ Connected to MongoDB: {settings.DATABASE_NAME}")


async def close_mongo_connection():
    global client
    if client:
        client.close()
        print("❌ MongoDB connection closed")


def get_db():
    return db
