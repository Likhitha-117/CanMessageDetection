from pymongo import MongoClient
import os
from dotenv import load_dotenv

load_dotenv()

MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017")
client = MongoClient(MONGO_URI)
db = client["can_ids"]

users = list(db.users.find({}, {"email": 1, "role": 1, "approved": 1}))
print("USERS IN DB:")
for u in users:
    print(u)
