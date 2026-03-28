"""
MongoDB async connection using Motor.
"""
from motor.motor_asyncio import AsyncIOMotorClient
from .config import settings

client: AsyncIOMotorClient = None
db = None


async def connect_to_mongo():
    global client, db
    try:
        client = AsyncIOMotorClient(settings.MONGODB_URL)
        # Verify connection
        await client.admin.command('ping')
        db = client[settings.DATABASE_NAME]

        # Create indexes
        await db.users.create_index("email", unique=True)
        # Single Admin Constraint
        await db.users.create_index(
            [("role", 1)],
            unique=True,
            partialFilterExpression={"role": "admin"}
        )
        await db.vehicles.create_index("vehicle_id", unique=True)
        await db.vehicles.create_index("vehicle_api_key", unique=True)
        await db.logs.create_index("vehicle_id")
        await db.logs.create_index("timestamp")
        await db.logs.create_index("prediction")
        
        print("✅ Connected to MongoDB Atlas successfully")
    except Exception as e:
        print(f"❌ Failed to connect to MongoDB Atlas: {e}")
        raise e


async def close_mongo_connection():
    global client
    if client:
        client.close()
        print("❌ MongoDB connection closed")


def get_db():
    return db
