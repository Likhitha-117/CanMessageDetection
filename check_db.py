import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def check():
    client = AsyncIOMotorClient("mongodb://localhost:27017")
    db = client.can_ids_db
    users = await db.users.find().to_list(10)
    for u in users:
        print(f"Email: {u['email']}, Role: {u['role']}, Approved: {u['approved']}")
    
    vehicles = await db.vehicles.find().to_list(10)
    for v in vehicles:
        print(f"Vehicle: {v['vehicle_id']}, Assigned Engineers: {v.get('assigned_engineers', [])}")

if __name__ == "__main__":
    asyncio.run(check())
