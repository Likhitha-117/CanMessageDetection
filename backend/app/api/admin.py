"""
Admin routes: user approval, vehicle creation, engineer assignment, system stats.
"""
import secrets
from datetime import datetime, timezone

from typing import List
from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException

from ..core.database import get_db
from ..core.dependencies import require_role
from ..models.schemas import (
    AssignEngineerRequest,
    UserOut,
    VehicleOut,
    VehicleAdminOut,
    EngineerOut,
)

router = APIRouter(prefix="/api/admin", tags=["Admin"])


@router.get("/pending-users")
async def pending_users(user=Depends(require_role("admin"))):
    db = get_db()
    cursor = db.users.find({"approved": False})
    users = []
    async for u in cursor:
        u["_id"] = str(u["_id"])
        users.append(u)
    return users


@router.post("/approve-user/{user_id}")
async def approve_user(user_id: str, user=Depends(require_role("admin"))):
    db = get_db()
    result = await db.users.update_one(
        {"_id": ObjectId(user_id)}, {"$set": {"approved": True}}
    )
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="User not found or already approved")
    return {"message": "User approved successfully"}


@router.get("/vehicles", response_model=List[VehicleAdminOut])
async def list_vehicles(user=Depends(require_role("admin"))):
    db = get_db()
    cursor = db.vehicles.find()
    vehicles = []
    async for v in cursor:
        v["_id"] = str(v["_id"])
        
        # Fetch owner name
        owner = await db.users.find_one({"_id": ObjectId(v["owner_id"])}, {"full_name": 1})
        v["owner_name"] = owner["full_name"] if owner else "Unknown"
        
        # Fetch engineer names
        engineer_names = []
        for eid in v.get("assigned_engineers", []):
            eng = await db.users.find_one({"_id": ObjectId(eid)}, {"full_name": 1})
            if eng:
                engineer_names.append(eng["full_name"])
        v["engineer_names"] = engineer_names
        
        # Ensure API key is NEVER returned
        v.pop("vehicle_api_key", None)
        vehicles.append(v)
    return vehicles


@router.get("/engineers", response_model=List[EngineerOut])
async def list_engineers(user=Depends(require_role("admin"))):
    db = get_db()
    cursor = db.users.find({"role": "engineer", "approved": True})
    engineers = []
    async for e in cursor:
        e["_id"] = str(e["_id"])
        engineers.append(e)
    return engineers


@router.post("/assign-engineer")
async def assign_engineer(
    req: AssignEngineerRequest, user=Depends(require_role("admin"))
):
    db = get_db()
    # Verify engineer exists
    engineer = await db.users.find_one(
        {"_id": ObjectId(req.engineer_id), "role": "engineer"}
    )
    if not engineer:
        raise HTTPException(status_code=404, detail="Engineer not found")

    result = await db.vehicles.update_one(
        {"vehicle_id": req.vehicle_id},
        {"$addToSet": {"assigned_engineers": req.engineer_id}},
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Vehicle not found")

    await db.users.update_one(
        {"_id": ObjectId(req.engineer_id)},
        {"$addToSet": {"assigned_vehicles": req.vehicle_id}},
    )

    return {"message": "Engineer assigned successfully"}


@router.get("/all-logs")
async def all_logs(
    vehicle_id: str = None,
    skip: int = 0,
    limit: int = 50,
    user=Depends(require_role("admin"))
):
    db = get_db()
    query = {}
    if vehicle_id:
        query["vehicle_id"] = vehicle_id
    
    projection = {
        "data": 0,
        "payload": 0,
        "extractedFeatures": 0,
        "features": 0, # Legacy
    }
    cursor = db.logs.find(query, projection).sort("timestamp", -1).skip(skip).limit(limit)
    logs = []
    async for log in cursor:
        log["_id"] = str(log["_id"])
        logs.append(log)
    return logs


@router.get("/system-stats")
async def system_stats(
    vehicle_id: str = None,
    user=Depends(require_role("admin"))
):
    db = get_db()
    
    # Base filters
    stats_query = {}
    logs_match = {}
    
    if vehicle_id:
        stats_query["vehicle_id"] = vehicle_id
        logs_match["vehicle_id"] = vehicle_id

    total_users = await db.users.count_documents({})
    pending = await db.users.count_documents({"approved": False})
    total_vehicles = await db.vehicles.count_documents({})
    total_logs = await db.logs.count_documents(stats_query)

    # Attack distribution
    pipeline = [
        {"$match": {**logs_match, "prediction": {"$exists": True}}},
        {"$group": {"_id": "$prediction", "count": {"$sum": 1}}},
    ]
    dist = {}
    async for doc in db.logs.aggregate(pipeline):
        if doc["_id"]:
            dist[doc["_id"]] = doc["count"]

    return {
        "total_users": total_users,
        "pending_approvals": pending,
        "total_vehicles": total_vehicles,
        "total_logs": total_logs,
        "attack_distribution": dist,
    }
