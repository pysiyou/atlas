# Atlas Laboratory Management System

Monorepo containing the Atlas LIMS frontend (React + Vite) and backend (FastAPI + PostgreSQL).

## Structure

```
Atlas/
├── backend/     # FastAPI API server
├── contracts/   # Cross-stack source of truth (enums, constants)
├── frontend/    # React SPA
└── scripts/     # Codegen and tooling
```

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

GitHub Actions runs frontend lint/typecheck/knip, backend ruff, and a codegen drift check on every push and PR.
