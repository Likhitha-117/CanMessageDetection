from pymongo import MongoClient
import os
from dotenv import load_dotenv

load_dotenv()

MONGO_URL = os.getenv("MONGODB_URL")
if not MONGO_URL:
    raise ValueError("MONGODB_URL environment variable is not set")
client = MongoClient(MONGO_URL)
db = client["can_ids"]

users = list(db.users.find({}, {"email": 1, "role": 1, "approved": 1}))
print("USERS IN DB:")
for u in users:
    print(u)
