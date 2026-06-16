import numpy as np
from sklearn.preprocessing import MinMaxScaler
from pymongo import MongoClient

client = MongoClient("mongodb://localhost:27017")
db = client["pulse"]
collection = db["containermetrics"]

SEQUENCE_LENGTH = 20  # each training sample = 20 consecutive readings

def fetch_metrics(container_id: str, limit: int = 200):
    docs = list(
        collection
        .find({ "containerId": container_id }, { "_id": 0, "cpuPercent": 1, "memoryPercent": 1 })
        .sort("timestamp", 1)  # oldest first — order matters for sequences
        .limit(limit)
    )
    return docs

def build_sequences(docs):
    if len(docs) < SEQUENCE_LENGTH:
        return None, None, None

    # Raw 2D array — shape (N, 2): [[cpu, mem], [cpu, mem], ...]
    raw = np.array([[d["cpuPercent"], d["memoryPercent"]] for d in docs])

    # Scale each feature to 0-1 independently
    scaler = MinMaxScaler()
    scaled = scaler.fit_transform(raw)

    # Sliding window — each sample is SEQUENCE_LENGTH consecutive timesteps
    sequences = []
    for i in range(len(scaled) - SEQUENCE_LENGTH):
        sequences.append(scaled[i : i + SEQUENCE_LENGTH])

    # Shape: (num_sequences, SEQUENCE_LENGTH, 2)
    X = np.array(sequences, dtype=np.float32)
    return X, scaler, scaled