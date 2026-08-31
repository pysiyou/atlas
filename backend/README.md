# Atlas Backend

FastAPI backend for the Atlas Laboratory Management System.

## Setup

```bash
./setup.sh
```

## Run

```bash
poetry run uvicorn app.main:app --reload
```

API docs: http://localhost:8000/docs

## Structure

- `app/api/v1/` — HTTP route handlers
- `app/services/` — Business logic
- `app/models/` — SQLAlchemy ORM models
- `app/schemas/` — Pydantic request/response schemas (enums generated from `contracts/`)
