import os
import joblib
import numpy as np
import tensorflow as tf
from pathlib import Path

# Setup paths
BASE_DIR = Path("d:/FinalYearProject")
MODEL_DIR = BASE_DIR / "LSTM"
MODEL_PATH = MODEL_DIR / "lstm.h5"
SCALER_PATH = MODEL_DIR / "lstm_minmax_scaler.pkl"
LABELS_PATH = MODEL_DIR / "class_labels_lstm.npy"

# Load artifacts
model = tf.keras.models.load_model(str(MODEL_PATH))
scaler = joblib.load(str(SCALER_PATH))
class_labels = np.load(str(LABELS_PATH))

# User's Replay data snippet (converted to list of [can_id, dlc, d0...d7])
# I'll take the first 10 rows from the user's message
replay_data = [
    [848, 8, 5, 40, 132, 102, 109, 0, 0, 162],
    [704, 8, 20, 0, 0, 0, 0, 0, 0, 0],
    [1072, 8, 0, 0, 0, 0, 0, 0, 0, 0],
    [1201, 8, 0, 0, 0, 0, 0, 0, 0, 0],
    [497, 8, 0, 0, 0, 0, 0, 0, 0, 0],
    [339, 8, 0, 0, 0, 255, 0, 255, 0, 0],
    [2, 8, 0, 0, 0, 0, 0, 0, 0, 10],
    [399, 8, 254, 54, 0, 0, 0, 60, 0, 0],
    [304, 8, 3, 128, 0, 255, 33, 128, 0, 157],
    [305, 8, 0, 128, 0, 0, 45, 127, 0, 151]
]

# Scale features
scaled_data = scaler.transform(np.array(replay_data))

# Reshape for LSTM (1, seq_length, 10)
sequence = np.expand_dims(scaled_data, axis=0)

# Predict
preds = model.predict(sequence, verbose=0)
class_idx = np.argmax(preds[0])
confidence = preds[0][class_idx]

print(f"--- Diagnostic Results ---")
print(f"Predicted Class Index: {class_idx}")
print(f"Mapped Label: {class_labels[class_idx]}")
print(f"Confidence: {confidence:.4f}")
print(f"Raw Preds: {preds[0].tolist()}")
