"""
Engineer routes: assigned vehicles, full logs, attack distribution.
"""
from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
import csv
import io

from ..core.database import get_db
from ..core.dependencies import require_role

router = APIRouter(prefix="/api/engineer", tags=["Engineer"])


@router.get("/assigned-vehicles")
async def assigned_vehicles(user=Depends(require_role("engineer"))):
    db = get_db()
    vehicles = []
    for vid in user.get("assigned_vehicles", []):
        v = await db.vehicles.find_one({"vehicle_id": vid})
        if v:
            v["_id"] = str(v["_id"])
            v.pop("vehicle_api_key", None)
            vehicles.append(v)
    return vehicles


@router.get("/vehicle-logs/{vehicle_id}")
async def vehicle_logs(
    vehicle_id: str,
    skip: int = 0,
    limit: int = 50,
    user=Depends(require_role("engineer")),
):
    # Verify the engineer is assigned to this vehicle
    if vehicle_id not in user.get("assigned_vehicles", []):
        raise HTTPException(status_code=403, detail="Not assigned to this vehicle")

    db = get_db()
    cursor = (
        db.logs.find({"vehicle_id": vehicle_id})
        .sort("timestamp", -1)
        .skip(skip)
        .limit(limit)
    )
    logs = []
    async for log in cursor:
        log["_id"] = str(log["_id"])
        logs.append(log)
    return logs


@router.get("/attack-distribution/{vehicle_id}")
async def attack_distribution(
    vehicle_id: str, user=Depends(require_role("engineer"))
):
    if vehicle_id not in user.get("assigned_vehicles", []):
        raise HTTPException(status_code=403, detail="Not assigned to this vehicle")

    db = get_db()
    pipeline = [
        {"$match": {"vehicle_id": vehicle_id, "prediction": {"$exists": True}}},
        {"$group": {"_id": "$prediction", "count": {"$sum": 1}}},
    ]
    dist = {}
    async for doc in db.logs.aggregate(pipeline):
        if doc["_id"]:
            dist[doc["_id"]] = doc["count"]

    # Timeline data (last 24h, grouped by hour)
    from datetime import datetime, timezone, timedelta

    since = datetime.now(timezone.utc) - timedelta(hours=24)
    timeline_pipeline = [
        {
            "$match": {
                "vehicle_id": vehicle_id, 
                "timestamp": {"$gte": since},
                "prediction": {"$exists": True}
            }
        },
        {
            "$group": {
                "_id": {
                    "hour": {"$hour": "$timestamp"},
                    "prediction": "$prediction",
                },
                "count": {"$sum": 1},
            }
        },
        {"$sort": {"_id.hour": 1}},
    ]
    timeline = []
    async for doc in db.logs.aggregate(timeline_pipeline):
        timeline.append(
            {
                "hour": doc["_id"]["hour"],
                "prediction": doc["_id"]["prediction"],
                "count": doc["count"],
            }
        )

    return {"distribution": dist, "timeline": timeline}


@router.get("/download-csv/{vehicle_id}")
async def download_csv(
    vehicle_id: str, user=Depends(require_role("engineer"))
):
    if vehicle_id not in user.get("assigned_vehicles", []):
        raise HTTPException(status_code=403, detail="Not assigned to this vehicle")

    db = get_db()
    cursor = db.logs.find({"vehicle_id": vehicle_id}).sort("timestamp", -1).limit(1000)
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(
        [
            "timestamp", "vehicle_id", "can_id", "dlc",
            "data_0", "data_1", "data_2", "data_3",
            "data_4", "data_5", "data_6", "data_7",
            "prediction", "confidence",
        ]
    )
    async for log in cursor:
        data_list = log.get("data", [0]*8)
        writer.writerow(
            [
                log.get("timestamp", ""),
                log.get("vehicle_id", ""),
                log.get("can_id", ""),
                log.get("dlc", 8),
                *data_list,
                log.get("prediction", ""),
                log.get("confidence", ""),
            ]
        )
    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={vehicle_id}_logs.csv"},
    )
