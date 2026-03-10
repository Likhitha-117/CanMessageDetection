from collections import deque
from typing import Tuple
import numpy as np
from ..core.config import settings
from ..ml import model_loader
from ..core.class_labels import get_label

class IntrusionDetector:
    """Manages model buffering and inference using real Keras model."""

    def __init__(self):
        self.vehicle_buffers: dict[str, deque] = {}
        self.seq_length = settings.SEQ_LENGTH
        self.feature_count = settings.FEATURE_COUNT

    def _get_buffer(self, vehicle_id: str) -> deque:
        if vehicle_id not in self.vehicle_buffers:
            self.vehicle_buffers[vehicle_id] = deque(maxlen=self.seq_length)
        return self.vehicle_buffers[vehicle_id]

    def add_features(self, vehicle_id: str, features: list[float]):
        """
        Receive features [can_id, dlc, d0..d7] and append to sliding window.
        Applies scaling using the loaded model scaler.
        """
        # 1. Scale features
        feat_array = np.array(features).reshape(1, -1)
        scaled_feat = model_loader.scaler.transform(feat_array).flatten()
        
        buf = self._get_buffer(vehicle_id)
        buf.append(scaled_feat)

    def can_predict(self, vehicle_id: str) -> bool:
        buf = self._get_buffer(vehicle_id)
        return len(buf) == self.seq_length

    def predict(self, vehicle_id: str) -> Tuple[str, float]:
        """Run inference on the current sliding window."""
        buf = self._get_buffer(vehicle_id)
        # Sequence shape should be (1, sequence_length, feature_count)
        sequence = np.array(list(buf), dtype=np.float32)
        sequence = np.expand_dims(sequence, axis=0) # (1, 20, 10)
        
        # Predict
        preds = model_loader.model.predict(sequence, verbose=0)
        class_idx = np.argmax(preds[0])
        confidence = float(preds[0][class_idx])
        
        # Map to label
        idx = int(model_loader.class_labels[class_idx])
        prediction_label = get_label(idx)
        
        return prediction_label, round(confidence, 4)

# Singleton
detector = IntrusionDetector()
