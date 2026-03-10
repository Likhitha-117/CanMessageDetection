"""
Batch analysis routes for uploaded datasets.
"""
import io
import pandas as pd
import numpy as np
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from typing import Dict, Any

from ..core.database import get_db
from ..core.dependencies import require_role
from ..core.config import settings
from ..ml import model_loader
from ..core.class_labels import CLASS_LABELS, NORMAL_CLASS, get_label

router = APIRouter(prefix="/api/analysis", tags=["Analysis"])

@router.post("/upload-dataset")
async def upload_dataset(
    file: UploadFile = File(...),
    user=Depends(require_role("engineer"))
):
    # 1. Basic File Validation
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="Only CSV files are supported")

    try:
        content = await file.read()
        if not content:
            raise HTTPException(status_code=400, detail="Empty file uploaded")
            
        df = pd.read_csv(io.BytesIO(content))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid CSV: {str(e)}")

    # 2. Column Validation
    required_cols = [
        "timestamp", "can_id", "dlc", 
        "data_0", "data_1", "data_2", "data_3", 
        "data_4", "data_5", "data_6", "data_7"
    ]
    
    missing_cols = [col for col in required_cols if col not in df.columns]
    if missing_cols:
        raise HTTPException(
            status_code=400, 
            detail=f"Missing required columns: {', '.join(missing_cols)}"
        )

    # 3. Data Integrity Validation
    if df['dlc'].ne(8).any():
        raise HTTPException(status_code=400, detail="Invalid data length: dlc must be 8 for all rows")
    
    # Ensure all data_x are integers
    data_cols = [f"data_{i}" for i in range(8)]
    for col in data_cols:
        if not pd.api.types.is_integer_dtype(df[col]):
            try:
                df[col] = df[col].astype(int)
            except:
                raise HTTPException(status_code=400, detail=f"Column {col} must contain integers")

    total_logs = len(df)
    if total_logs < settings.SEQ_LENGTH:
        raise HTTPException(
            status_code=400, 
            detail=f"Dataset is too small (minimum {settings.SEQ_LENGTH} rows required)"
        )

    # 4. Feature Construction (MUST Match Training)
    # [can_id, dlc, data_0, data_1, data_2, data_3, data_4, data_5, data_6, data_7]
    feature_cols = ["can_id", "dlc"] + data_cols
    features = df[feature_cols].values.astype(float)

    # 5. Preprocessing (Scaling)
    if model_loader.scaler:
        features = model_loader.scaler.transform(features)

    # 6. Sequence Generation & Batch Prediction
    if model_loader.model is None:
        raise HTTPException(status_code=500, detail="Inference model not loaded on server")

    sequences = []
    # Sliding window logic
    for i in range(len(features) - settings.SEQ_LENGTH + 1):
        sequences.append(features[i:i + settings.SEQ_LENGTH])
    
    sequences = np.array(sequences, dtype=np.float32)
    total_sequences = len(sequences)

    # Prediction — shape: (N, num_classes)
    preds = model_loader.model.predict(sequences, verbose=0, batch_size=128)
    class_indices = np.argmax(preds, axis=1)   # (N,)
    confidences   = np.max(preds,   axis=1)    # (N,)

    # Summary Calculation
    normal_count = int(np.sum(class_indices == NORMAL_CLASS))
    attack_count = int(np.sum(class_indices != NORMAL_CLASS))
    
    attack_percentage = 0.0
    if total_sequences > 0:
        attack_percentage = round((attack_count / total_sequences) * 100, 2)

    # 7. Build per-sequence attack details
    attack_distribution = {"DoS": 0, "Fuzzing": 0, "Replay": 0, "Spoofing": 0}
    attack_logs = []

    for i, (class_idx, confidence) in enumerate(zip(class_indices, confidences)):
        if int(class_idx) == NORMAL_CLASS:
            continue

        # The last row of the sliding window is the representative row
        row_idx = i + settings.SEQ_LENGTH - 1
        row = df.iloc[row_idx]

        # Build hex payload string from data bytes
        payload_bytes = [row[f"data_{j}"] for j in range(8)]
        payload_hex = " ".join(f"{int(b):02X}" for b in payload_bytes)

        # Map via model_loader.class_labels (same as real-time pipeline)
        raw_idx = int(model_loader.class_labels[int(class_idx)])
        label_name = get_label(raw_idx)

        # Update distribution counters
        if label_name in attack_distribution:
            attack_distribution[label_name] += 1

        attack_logs.append({
            "timestamp": float(row["timestamp"]),
            "can_id": str(int(row["can_id"])),
            "payload": payload_hex,
            "predicted_label": int(class_idx),
            "label_name": label_name,
            "confidence": round(float(confidence), 4),
        })

    # 8. Store Forensic Report
    db = get_db()
    report_doc = {
        "engineer_id": user["_id"],
        "file_name": file.filename,
        "total_logs": total_logs,
        "total_sequences": total_sequences,
        "attack_count": attack_count,
        "normal_count": normal_count,
        "attack_percentage": attack_percentage,
        "attack_distribution": attack_distribution,
        "created_at": datetime.now(timezone.utc)
    }
    await db.forensic_reports.insert_one(report_doc)

    # 9. Return Summary + Details
    return {
        "message": "Dataset analyzed successfully",
        "summary": {
            "total_logs": total_logs,
            "total_sequences": total_sequences,
            "attack_count": attack_count,
            "normal_count": normal_count,
            "attack_percentage": attack_percentage,
        },
        "attack_distribution": attack_distribution,
        "attack_logs": attack_logs,
    }
