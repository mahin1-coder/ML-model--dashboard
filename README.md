# ML Model Deployment Dashboard

A full-stack ML dashboard with **FastAPI + Scikit-Learn** backend and **React** frontend. It serves regression and classification predictions, model metrics, and Power BI–friendly export endpoints.

## Project structure

```
ml-model-dashboard/
  backend/
  frontend/
```

## Features

- Regression (Diabetes dataset) and classification (Breast Cancer dataset)
- Model training with saved artifacts
- Prediction endpoints
- Metrics endpoint
- Power BI–friendly export endpoints (CSV/JSON)
- React UI to run predictions

## Backend (FastAPI)

### Setup

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

### Run

```bash
uvicorn app.main:app --reload
```

### API endpoints

- `GET /health`
- `GET /metadata`
- `GET /metrics`
- `POST /predict/regression`
- `POST /predict/classification`
- `GET /export/regression?format=csv|json`
- `GET /export/classification?format=csv|json`

## Frontend (React)

### Setup

```bash
cd frontend
npm install
```

### Run

```bash
npm run dev
```

### Configure API URL

Create `frontend/.env` (optional):

```
VITE_API_URL=http://localhost:8000
```

## Power BI

Connect to the export endpoints:

- `http://localhost:8000/export/regression?format=csv`
- `http://localhost:8000/export/classification?format=csv`

## Tests

```bash
cd backend
pytest
```

## Notes

- Models are trained automatically on first run and cached under `backend/models/`.
- The UI reads feature names dynamically from `GET /metadata`.
