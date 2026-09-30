# Atlas backend

FastAPI + PostgreSQL API for the Atlas Laboratory Management System.

## Layout

```text
app/
├── main.py
├── platform/           # config, DB, cache, security, middleware, HTTP deps
├── shared/
│   ├── contracts/      # codegen enums + lab constants + test catalog JSON
│   └── schemas/        # pagination, error DTOs
└── domains/            # feature-aligned modules (auth, patients, orders, lab, …)
```

## Setup

```bash
cd backend
./setup.sh
poetry run uvicorn app.main:app --reload
```

Reset and seed a fresh database (drops all tables):

```bash
poetry run python -m app.platform.bootstrap
```

Copy `.env.example` to `.env` and set `DATABASE_URL` and `SECRET_KEY`.

## Lint

```bash
poetry run ruff check app/
poetry run ruff format --check app/
```
