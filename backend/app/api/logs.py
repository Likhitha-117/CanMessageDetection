"""
Log ingestion endpoint.
Receives CAN log data from vehicle simulators,
buffers features, runs BiLSTM inference, and stores results.
"""
from datetime import datetime, timezone

from fastapi import APIRouter, Depends

from ..core.database import get_db
from ..core.dependencies import get_vehicle_by_api_key
from ..models.schemas import LogIngestRequest
from ..services.prediction_service import detector
from ..core.class_labels import get_label

router = APIRouter(prefix="/api/logs", tags=["Log Ingestion"])


@router.post("/ingest")
async def ingest_log(req: LogIngestRequest, vehicle=Depends(get_vehicle_by_api_key)):
    db = get_db()
    vehicle_id = vehicle["vehicle_id"]

    # 1. Validate real CAN data
    if req.dlc != 8 or len(req.data) != 8:
        from fastapi import HTTPException
        raise HTTPException(status_code=400, detail="Invalid CAN data: DLC and data length must be 8")

    # 2. Construct model input vector (10 features)
    # Order: can_id, dlc, data[0], ..., data[7]
    features_list = [float(req.can_id), float(req.dlc)] + [float(b) for b in req.data]

    # 3. Add to sliding-window buffer
    detector.add_features(vehicle_id, features_list)

    prediction = None
    confidence = None

    if detector.can_predict(vehicle_id):
        prediction, confidence = detector.predict(vehicle_id)

    # 4. Build log document for storage
    try:
        # Try ISO format first
        ts = datetime.fromisoformat(req.timestamp)
        if ts.tzinfo is None:
            ts = ts.replace(tzinfo=timezone.utc)
    except ValueError:
        # Fallback to Unix timestamp
        try:
            ts = datetime.fromtimestamp(float(req.timestamp), tz=timezone.utc)
        except (ValueError, TypeError):
            from fastapi import HTTPException
            raise HTTPException(
                status_code=400, 
                detail="Invalid timestamp format. Expected ISO 8601 string or Unix timestamp."
            )

    log_doc = {
        "vehicle_id": vehicle_id,
        "timestamp": ts,
        "can_id": req.can_id,
        "dlc": req.dlc,
        "data": req.data,
        "payload": req.data,
        "extractedFeatures": features_list,
        "model_version": "LSTM_v1",
        "created_at": datetime.now(timezone.utc),
    }
    if prediction is not None:
        log_doc["prediction"] = prediction
        # Map label name back to index for predictedLabel if possible
        # Importing CLASS_LABELS locally to avoid circular dependencies
        from ..core.class_labels import CLASS_LABELS
        label_to_idx = {v: k for k, v in CLASS_LABELS.items()}
        
        log_doc["labelName"] = prediction
        log_doc["predictedLabel"] = label_to_idx.get(prediction)
        log_doc["confidenceScore"] = confidence
        log_doc["confidence"] = confidence  # Keep existing field for compatibility
    
    result = await db.logs.insert_one(log_doc)
    log_doc["_id"] = str(result.inserted_id)

    return {
        "status": "ok",
        "log_id": str(result.inserted_id),
        "prediction": prediction,
        "confidence": confidence,
    }
