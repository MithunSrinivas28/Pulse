# Pulse — Container Health Monitoring System

I built Pulse as a full-stack engineering project to monitor Docker containers in real time, detect anomalies using machine learning, and surface everything through a clean dashboard.

---

## What It Does

Pulse connects directly to the Docker Engine on your machine, polls every running container every 10 seconds, stores the metrics in MongoDB, and serves them through a REST API. A separate Python ML service trains an LSTM Autoencoder on normal container behavior and flags anomalies when something looks off. A React dashboard ties it all together — live cards, time-series charts, and anomaly indicators updating in real time.


---
<img width="1693" height="929" alt="ChatGPT Image Jun 17, 2026, 03_27_31 PM" src="https://github.com/user-attachments/assets/daa8d946-0238-47ac-910b-4228067dceb9" />

---

## Architecture

```
Docker Engine
     │
     ▼
Node.js Poller (Dockerode)
     │  every 10 seconds
     ▼
MongoDB (containermetrics collection)
     │
     ├──► Express REST API ──► React Dashboard
     │
     └──► Python ML Service (FastAPI + PyTorch LSTM)
                │
                └──► Anomaly Scores ──► Dashboard Cards
```

---

## Tech Stack

**Backend** — Node.js, Express, Dockerode, Mongoose, MongoDB

**ML Service** — Python, FastAPI, PyTorch, scikit-learn

**Dashboard** — React 19, Vite, Recharts, Axios

---

## Devops & Backend

The first thing I needed was a reliable way to talk to Docker from Node.js. Dockerode handles this by making HTTP requests directly to the Docker socket — on Windows that's the named pipe at `//./pipe/docker_engine`, the same one the Docker CLI uses. No daemon, no TCP port, just a socket.

From there I built a polling loop that runs every 10 seconds. For each running container it fetches a stat snapshot and calculates CPU percentage from raw CPU tick deltas — exactly how `docker stats` does it. Memory percentage is simpler, just usage divided by limit.

Every poll result gets saved as a document in MongoDB. The Mongoose schema is straightforward: container ID, name, image, CPU percent, memory percent, restart count, and a timestamp. I added a compound index on `containerId` and `timestamp` so time-range queries stay fast as the collection grows.

Two API endpoints complete the backend. `GET /api/containers` returns the latest snapshot per container, which is what the dashboard cards read. `GET /api/containers/:id/metrics` returns the last 50 readings for a specific container, which feeds the time-series chart.

---

## The ML Service

The anomaly detection problem here is unsupervised — I don't have labeled data saying "this is an anomaly." So I chose an LSTM Autoencoder, a model that learns to reconstruct sequences of normal behavior. When it sees something unusual, reconstruction error spikes. That spike is the anomaly signal.

The data pipeline in `data.py` pulls metrics from MongoDB sorted oldest-first (order matters for sequences), normalizes CPU and memory to 0–1 using MinMaxScaler, then builds sliding window sequences of length 20. So 159 documents becomes 139 training samples of shape (139, 20, 2).

The model itself has two LSTM layers. The encoder compresses the input sequence down to a hidden state. The decoder takes that hidden state and reconstructs the full sequence. An output linear layer maps back to the original two features. Training uses MSE loss — the lower the loss, the better the model reconstructs normal patterns.

The FastAPI service exposes `/train/:id` to train a model for any container on demand, and `/predict/:id` to score the most recent sequence and return a reconstruction error with an anomaly flag. Models are stored in memory per container.

---

## The Dashboard

The dashboard is  minimal. Dark background, white text, subtle borders.
Each container gets a card showing live CPU and memory as thin progress bars, a restart count badge, and a red anomaly dot when the ML service flags something unusual. Clicking a card loads a time-series chart below showing the last 50 readings with CPU as a white line and memory as gray.

The React side uses custom hooks to keep data fetching separate from rendering. `useContainers` polls the Node.js API every 10 seconds and guards against non-array responses. The chart component fetches metrics independently per selected container and reverses the array so time reads left to right.

One practical note: Tailwind v3 had config conflicts in this Vite environment so I switched to raw CSS. And rather than fighting Vite's proxy config, I added the `cors` package to the Express backend — cleaner and more explicit.

---

## Project Structure

```
pulse/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   └── db.js
│   │   ├── models/
│   │   │   └── ContainerMetric.js
│   │   ├── services/
│   │   │   ├── docker.js
│   │   │   └── poller.js
│   │   ├── routes/
│   │   │   └── containers.js
│   │   └── index.js
│   └── package.json
│
├── ml-service/
│   ├── main.py
│   ├── model.py
│   ├── data.py
│   └── requirements.txt
│
└── dashboard/
    ├── src/
    │   ├── components/
    │   │   ├── Navbar.jsx
    │   │   ├── ContainerCard.jsx
    │   │   └── MetricsChart.jsx
    │   ├── hooks/
    │   │   └── useContainers.js
    │   └── App.jsx
    └── package.json
```

---

## Running Locally

**Prerequisites:** Node.js, Python 3.10+, MongoDB running locally, Docker Desktop

**Backend**

```bash
cd backend
npm install
node src/index.js
```

Runs on `http://localhost:3001`

**ML Service**

```bash
cd ml-service
python -m venv venv
venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

Runs on `http://localhost:8000`

**Dashboard**

```bash
cd dashboard
npm install
npm run dev
```

Runs on `http://localhost:5173`

**Train the anomaly model for a container**

```bash
curl -X POST http://localhost:8000/train/{containerId}
```

---

## API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/containers` | Latest stats per container |
| GET | `/api/containers/:id/metrics` | Last 50 readings for a container |
| GET | `/health` | ML service health check |
| POST | `/train/:id` | Train LSTM model for a container |
| GET | `/predict/:id` | Get anomaly score for a container |

---

## What's Next

Wire the ML anomaly scores directly into the dashboard cards with live polling. Add auto-training on service startup. Persist trained models to disk so they survive restarts. Containerize the whole stack with Docker Compose.
