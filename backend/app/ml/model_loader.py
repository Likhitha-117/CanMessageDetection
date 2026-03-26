import os
import joblib
import numpy as np
import tensorflow as tf
from pathlib import Path

# Paths
BASE_DIR = Path(__file__).resolve().parent.parent.parent.parent
MODEL_DIR = BASE_DIR / "bilstm"
LSTM_DIR = BASE_DIR / "LSTM"

# Artifacts
MODEL_PATH = MODEL_DIR / "bilstm.h5"
SCALER_PATH = LSTM_DIR / "lstm_minmax_scaler.pkl"
LABELS_PATH = LSTM_DIR / "class_labels_lstm.npy"

# Global objects
model = None
scaler = None
class_labels = None

def validate_artifacts():
    """Ensure all required model artifacts exist."""
    missing = []
    for p in [MODEL_PATH, SCALER_PATH, LABELS_PATH]:
        if not p.exists():
            missing.append(str(p))
    
    if missing:
        raise RuntimeError(f"CRITICAL: Missing model artifacts: {', '.join(missing)}")

def load_all():
    """Load model, scaler, and labels into memory."""
    global model, scaler, class_labels
    
    validate_artifacts()
    
    try:
        print(f"🔄 Loading BiLSTM model from {MODEL_PATH}...")
        model = tf.keras.models.load_model(str(MODEL_PATH))
        print("✅ BiLSTM model loaded successfully")
        
        print(f"🔄 Loading scaler from {SCALER_PATH}...")
        scaler = joblib.load(str(SCALER_PATH))
        print("✅ Scaler loaded")
        
        print(f"🔄 Loading class labels from {LABELS_PATH}...")
        class_labels = np.load(str(LABELS_PATH))
        print(f"✅ Class labels loaded: {class_labels}")
        
    except Exception as e:
        raise RuntimeError(f"CRITICAL: Failed to load model artifacts: {e}")

# Call load_all on import for singleton-like behavior if needed, 
# but better to call it explicitly in main.py startup.
