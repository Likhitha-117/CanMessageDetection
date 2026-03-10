"""
Centralized class label mapping for the LSTM model.
"""

CLASS_LABELS = {
    0: "Normal",
    1: "DoS",
    2: "Fuzzing",
    3: "Replay",
    4: "Spoofing"
}

NORMAL_CLASS = 0

def get_label(class_idx):
    """Safely convert numeric class index to string label."""
    if class_idx is None:
        return None
    
    # Handle string inputs if they happen to come through
    try:
        idx = int(class_idx)
    except (ValueError, TypeError):
        return str(class_idx) if class_idx else None
        
    if idx not in CLASS_LABELS:
        raise ValueError(f"Invalid class index: {idx}")
        
    return CLASS_LABELS[idx]
