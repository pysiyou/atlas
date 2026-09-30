# Atlas Laboratory Management System

Monorepo containing the Atlas LIMS frontend (React + Vite) and backend (FastAPI + PostgreSQL).

## Structure

```
Atlas/
├── backend/     # FastAPI — app/domains/* mirrors frontend features
├── contracts/   # Cross-stack source of truth (enums, constants)
├── frontend/    # React SPA — src/features/*
└── scripts/     # Codegen and tooling
```

| Frontend `features/` | Backend `app/domains/` |
|----------------------|-------------------------|
| auth | auth |
| audit (was event-log) | audit |
| patients | patients |
| catalog (+ affiliation pricing API) | catalog |
| orders | orders |
| payments | payments |
| lab | lab |
| dashboard | dashboard |
| reports | reports |

## Quick start

### Backend

```bash
cd backend
./setup.sh
poetry run uvicorn app.main:app --reload
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

### Codegen

Regenerate TypeScript and Python types from `contracts/`:

```bash
cd scripts/codegen
npm install
npm run codegen
```

## CI

GitHub Actions runs frontend lint/typecheck/knip, backend ruff (check + format), and a codegen drift check on every push and PR.
