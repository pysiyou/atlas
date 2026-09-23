# Atlas backend

FastAPI + PostgreSQL API for the Atlas Laboratory Management System.

## Layout

```text
app/
├── api/
│   ├── dependencies.py    # DI: get_db, current_user, pagination, RBAC
│   └── v1/                # HTTP routers
├── core/
│   ├── config.py          # Pydantic settings
│   ├── security.py        # JWT, password hashing
│   └── cache.py           # Redis
├── db/
│   ├── database.py        # Engine, session, Base
│   └── bootstrap.py       # Dev reset: create_all + seed
├── data/                  # Reference constants + test catalog JSON
├── models/
├── schemas/
├── services/
├── utils/
├── middleware/
└── main.py
```

## Setup

```bash
cd backend
./setup.sh
poetry run uvicorn app.main:app --reload
```

Reset and seed a fresh database (drops all tables):

```bash
poetry run python -m app.db.bootstrap
```

Copy `.env.example` to `.env` and set `DATABASE_URL` and `SECRET_KEY`.

## Lint

```bash
poetry run ruff check app/
poetry run ruff format --check app/
```
