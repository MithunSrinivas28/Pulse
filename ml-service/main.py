from fastapi import FastAPI
from pymongo import MongoClient
import torch
import torch.nn as nn
import numpy as np
from data import fetch_metrics, build_sequences
from model import LSTMAutoencoder

app = FastAPI()

client = MongoClient("mongodb://localhost:27017")
db = client["pulse"]
collection = db["containermetrics"]

# Stores trained model + scaler per container in memory
models = {}

@app.get("/health")
def health():
    return { "status": "ml-service running" }

@app.get("/data/{container_id}")
def get_data(container_id: str):
    docs = list(
        collection
        .find({ "containerId": container_id }, { "_id": 0 })
        .sort("timestamp", -1)
        .limit(50)
    )
    return { "container_id": container_id, "count": len(docs), "data": docs }

@app.get("/debug/{container_id}")
def debug_sequences(container_id: str):
    docs = fetch_metrics(container_id)
    X, scaler, scaled = build_sequences(docs)

    if X is None:
        return { "error": "Not enough data yet — need at least 20 readings" }

    return {
        "raw_docs": len(docs),
        "sequences_created": X.shape[0],
        "sequence_length": X.shape[1],
        "features": X.shape[2],
        "sample_sequence": X[0].tolist()
    }

@app.post("/train/{container_id}")
def train(container_id: str, epochs: int = 50):
    docs = fetch_metrics(container_id, limit=200)
    X, scaler, _ = build_sequences(docs)

    if X is None:
        return { "error": "Not enough data — need at least 20 readings" }

    X_tensor = torch.tensor(X)

    model = LSTMAutoencoder()
    optimizer = torch.optim.Adam(model.parameters(), lr=0.001)
    criterion = nn.MSELoss()

    model.train()
    for epoch in range(epochs):
        optimizer.zero_grad()
        output = model(X_tensor)
        loss = criterion(output, X_tensor)
        loss.backward()
        optimizer.step()

        if (epoch + 1) % 10 == 0:
            print(f"Epoch {epoch+1}/{epochs} — Loss: {loss.item():.6f}")

    models[container_id] = { "model": model, "scaler": scaler }

    return { "status": "trained", "container_id": container_id, "epochs": epochs, "final_loss": loss.item() }

@app.get("/predict/{container_id}")
def predict(container_id: str):
    if container_id not in models:
        return { "error": "No trained model for this container — call /train first" }

    docs = fetch_metrics(container_id, limit=50)
    X, _, _ = build_sequences(docs)

    if X is None:
        return { "error": "Not enough data" }

    saved = models[container_id]
    model = saved["model"]
    scaler = saved["scaler"]

    raw = np.array([[d["cpuPercent"], d["memoryPercent"]] for d in docs])
    scaled = scaler.transform(raw)

    recent = scaled[-20:].astype(np.float32)
    X_tensor = torch.tensor(recent).unsqueeze(0)

    model.eval()
    with torch.no_grad():
        output = model(X_tensor)

    error = nn.MSELoss()(output, X_tensor).item()
    is_anomaly = error > 0.01

    return {
        "container_id": container_id,
        "reconstruction_error": round(error, 6),
        "is_anomaly": is_anomaly,
        "threshold": 0.01
    }