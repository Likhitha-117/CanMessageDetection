from pymongo import MongoClient

def check():
    client = MongoClient("mongodb://localhost:27017")
    db = client.can_ids
    print(f"Checking database: can_ids")
    users = list(db.users.find().limit(10))
    for u in users:
        print(f"Email: {u['email']}, Role: {u['role']}, Approved: {u['approved']}")
    
    vehicles = list(db.vehicles.find().limit(10))
    for v in vehicles:
        print(f"Vehicle: {v['vehicle_id']}, Assigned Engineers: {v.get('assigned_engineers', [])}")

if __name__ == "__main__":
    check()
