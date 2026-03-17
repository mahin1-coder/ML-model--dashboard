# ML SaaS Platform

> A production-ready Machine Learning SaaS platform — upload datasets, train ML models, run predictions, and manage everything through a polished dashboard.

---

## Live Demo

| | URL |
|---|---|
| **Frontend** | https://frontend-lekg0fn8c-mahin1-coders-projects.vercel.app |
| **Backend API** | https://grand-presence-production-42e3.up.railway.app |
| **API Docs** | https://grand-presence-production-42e3.up.railway.app/docs |

---

## Features

- **Authentication** — JWT-based signup, login, protected routes
- **Dataset Management** — Upload CSV/Excel files, preview data, manage datasets
- **ML Model Training** — Train Random Forest, Logistic Regression, XGBoost models
- **Predictions** — Single and batch predictions via trained models
- **Model Metrics** — Accuracy, F1, confusion matrix, ROC curve, feature importance
- **Billing** — Stripe subscription tiers (Free / Pro)
- **Dark Mode** — Full light/dark theme support

---

## Tech Stack

**Backend:** FastAPI, PostgreSQL, SQLAlchemy 2.0, scikit-learn, XGBoost, JWT, Alembic, Railway

**Frontend:** React 18, Vite, Tailwind CSS, Recharts, Zustand, TanStack Query, Vercel

**Infrastructure:** Docker Compose, Kubernetes, Terraform (AWS)

---

## Project Structure

```
ml-dashboard/
├── backend/
│   ├── api/routes/        # auth, datasets, models, predictions, billing
│   ├── database/          # SQLAlchemy models & async connection
│   ├── ml_pipeline/       # preprocessing, training, evaluation
│   ├── services/          # business logic layer
│   ├── main.py
│   ├── config.py
│   ├── Dockerfile
│   ├── Procfile           # Railway start command
│   └── railway.toml
├── frontend/
│   └── src/
│       ├── pages/         # Login, Dashboard, Datasets, Models, Predictions
│       ├── components/    # reusable UI components
│       ├── charts/        # ML charts (confusion matrix, ROC, feature importance)
│       ├── hooks/         # useAuth, useTheme
│       └── utils/api.js   # Axios client wired to Railway backend
├── infrastructure/
│   ├── kubernetes/        # K8s deployment manifests
│   └── terraform/         # AWS VPC, RDS, ECS, S3
├── docker-compose.yml     # full local stack
├── docker-compose.dev.yml # dev databases only
└── .env.example
```

---

## Quick Start (Local)

**Prerequisites:** Python 3.11+, Node.js 18+, Docker Desktop

```bash
# 1. Clone
git clone https://github.com/mahin1-coder/ML-model--dashboard.git
cd ML-model--dashboard
cp .env.example .env

# 2. Start databases
docker compose -f docker-compose.dev.yml up -d

# 3. Backend
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000

# 4. Frontend (new terminal)
cd frontend
npm install
npm run dev
```

- App: http://localhost:5173
- API docs: http://localhost:8000/docs

---

## Deployment

### Backend to Railway

```bash
npm install -g @railway/cli
railway login
railway init
railway add --database postgres
railway variables --set "SECRET_KEY=your-secret"
railway up
```

### Frontend to Vercel

```bash
cd frontend
npx vercel --prod
```

---

## Environment Variables

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL asyncpg connection URL |
| `SECRET_KEY` | JWT signing secret (required) |
| `REDIS_URL` | Redis URL (optional) |
| `STRIPE_SECRET_KEY` | Stripe billing (optional) |
| `AWS_ACCESS_KEY_ID` | S3 storage (optional) |

See [.env.example](.env.example) for the full list.

---

## API Reference

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register` | Sign up |
| POST | `/api/auth/login` | Login, returns JWT |
| GET | `/api/users/me` | Current user |
| POST | `/api/datasets/` | Upload dataset |
| GET | `/api/datasets/` | List datasets |
| POST | `/api/models/train` | Train model |
| GET | `/api/models/` | List models |
| POST | `/api/predictions/{id}` | Single prediction |
| POST | `/api/predictions/{id}/batch` | Batch predictions |

Interactive docs: https://grand-presence-production-42e3.up.railway.app/docs

---

## License

MIT
