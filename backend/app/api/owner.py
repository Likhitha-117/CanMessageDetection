"""
Owner routes: view own vehicle, logs summary, attack summary.
"""
import secrets
from datetime import datetime, timezone
from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException

from ..core.database import get_db
from ..core.dependencies import require_role
from ..models.schemas import (
    OwnerRegisterVehicleRequest,
    VehicleRegOut,
    VehicleRegenerationOut,
)

router = APIRouter(prefix="/api/owner", tags=["Owner"])


@router.get("/my-vehicle")
async def my_vehicle(user=Depends(require_role("owner"))):
    db = get_db()
    vehicle_ids = user.get("assigned_vehicles", [])
    vehicles = []
    for vid in vehicle_ids:
        v = await db.vehicles.find_one({"vehicle_id": vid})
        if v:
            v["_id"] = str(v["_id"])
            # Remove hashed key
            v.pop("vehicle_api_key", None)
            
            # Fetch engineer names
            engineer_names = []
            for eid in v.get("assigned_engineers", []):
                eng = await db.users.find_one({"_id": ObjectId(eid)}, {"full_name": 1})
                if eng:
                    engineer_names.append(eng["full_name"])
            v["engineer_names"] = engineer_names
            vehicles.append(v)
    return vehicles


@router.post("/register-vehicle", response_model=VehicleRegOut)
async def register_vehicle(
    req: OwnerRegisterVehicleRequest, user=Depends(require_role("owner"))
):
    from ..core.security import hash_api_key
    db = get_db()
    
    existing = await db.vehicles.find_one({"vehicle_id": req.vehicle_id})
    if existing:
        raise HTTPException(status_code=400, detail="Vehicle ID already exists")

    plain_key = secrets.token_urlsafe(32)
    hashed_key = hash_api_key(plain_key)
    
    owner_id = str(user["_id"])
    vehicle_doc = {
        "vehicle_id": req.vehicle_id,
        "vin_number": req.vin_number,
        "license_plate": req.license_plate,
        "manufacturer": req.manufacturer,
        "model": req.model,
        "year": req.year,
        "ecu_count": req.ecu_count,
        "owner_id": owner_id,
        "assigned_engineers": [],
        "vehicle_api_key": hashed_key,
        "status": "active",
        "created_at": datetime.now(timezone.utc),
    }
    result = await db.vehicles.insert_one(vehicle_doc)

    # Add vehicle to owner's assigned list
    await db.users.update_one(
        {"_id": ObjectId(owner_id)},
        {"$addToSet": {"assigned_vehicles": req.vehicle_id}},
    )

    vehicle_doc["_id"] = str(result.inserted_id)
    vehicle_doc["vehicle_api_key"] = plain_key  # Return plaintext once
    return vehicle_doc


@router.post("/regenerate-api-key/{vehicle_id}", response_model=VehicleRegenerationOut)
async def regenerate_api_key(vehicle_id: str, user=Depends(require_role("owner"))):
    from ..core.security import hash_api_key
    db = get_db()
    
    # Verify ownership
    vehicle = await db.vehicles.find_one({"vehicle_id": vehicle_id, "owner_id": str(user["_id"])})
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found or not owned by you")
        
    plain_key = secrets.token_urlsafe(32)
    hashed_key = hash_api_key(plain_key)
    
    await db.vehicles.update_one(
        {"vehicle_id": vehicle_id},
        {"$set": {"vehicle_api_key": hashed_key}}
    )
    
    return {"vehicle_id": vehicle_id, "vehicle_api_key": plain_key}


@router.get("/my-logs")
async def my_logs(
    vehicle_id: str = None,
    skip: int = 0,
    limit: int = 20,
    user=Depends(require_role("owner"))
):
    db = get_db()
    assigned_vehicle_ids = user.get("assigned_vehicles", [])
    if not assigned_vehicle_ids:
        return []

    # Filter logic
    query_list = assigned_vehicle_ids
    if vehicle_id:
        if vehicle_id not in assigned_vehicle_ids:
            raise HTTPException(status_code=403, detail="Not authorized for this vehicle")
        query_list = [vehicle_id]

    cursor = (
        db.logs.find(
            {"vehicle_id": {"$in": query_list}},
            {
                "data": 0,          # Owner cannot see raw CAN data
                "payload": 0,
                "extractedFeatures": 0,
                "features": 0,      # Legacy cleanup
            },
        )
        .sort("timestamp", -1)
        .skip(skip)
        .limit(limit)
    )
    logs = []
    async for log in cursor:
        log["_id"] = str(log["_id"])
        logs.append(log)
    return logs


@router.get("/attack-summary")
async def attack_summary(
    vehicle_id: str = None,
    user=Depends(require_role("owner"))
):
    db = get_db()
    assigned_vehicle_ids = user.get("assigned_vehicles", [])
    if not assigned_vehicle_ids:
        return {"total_logs": 0, "attacks_today": 0, "distribution": {}}

    # Filter logic
    query_list = assigned_vehicle_ids
    if vehicle_id:
        if vehicle_id not in assigned_vehicle_ids:
            raise HTTPException(status_code=403, detail="Not authorized for this vehicle")
        query_list = [vehicle_id]

    from datetime import datetime, timezone, timedelta
    today_start = datetime.now(timezone.utc).replace(
        hour=0, minute=0, second=0, microsecond=0
    )

    total = await db.logs.count_documents({"vehicle_id": {"$in": query_list}})
    attacks_today = await db.logs.count_documents(
        {
            "vehicle_id": {"$in": query_list},
            "prediction": {"$exists": True, "$ne": "Normal"},
            "timestamp": {"$gte": today_start},
        }
    )

    pipeline = [
        {
            "$match": {
                "vehicle_id": {"$in": query_list},
                "prediction": {"$exists": True}
            }
        },
        {"$group": {"_id": "$prediction", "count": {"$sum": 1}}},
    ]
    dist = {}
    async for doc in db.logs.aggregate(pipeline):
        if doc["_id"]:
            dist[doc["_id"]] = doc["count"]

    return {
        "total_logs": total,
        "attacks_today": attacks_today,
        "distribution": dist,
    }
