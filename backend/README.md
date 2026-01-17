# Atlas Backend - FastAPI Laboratory Management System

## Quick Start

### 1. Install Dependencies

```bash
cd backend
poetry install
```

### 2. Configure Environment

Copy `.env.example` to `.env` and update the values:

```bash
cp .env.example .env
```

For development, you can use SQLite (default) or PostgreSQL.

### 3. Run the Server

```bash
poetry run uvicorn app.main:app --reload
```

The API will be available at `http://localhost:8000`

- API Documentation: `http://localhost:8000/docs`
- Alternative Docs: `http://localhost:8000/redoc`

## Project Structure

```
backend/
├── app/
│   ├── api/v1/          # API route handlers
│   ├── core/            # Security, dependencies
│   ├── models/          # SQLAlchemy database models
│   ├── schemas/         # Pydantic schemas
│   ├── services/        # Business logic
│   ├── utils/           # Utilities
│   ├── config.py        # Configuration
│   ├── database.py      # Database setup
│   └── main.py          # FastAPI app
├── pyproject.toml       # Dependencies
└── .env                 # Environment variables
```

## API Endpoints

### Authentication

- `POST /api/v1/auth/login` - Login
- `GET /api/v1/auth/me` - Get current user

### Patients

- `GET /api/v1/patients` - List patients
- `POST /api/v1/patients` - Create patient
- `GET /api/v1/patients/{id}` - Get patient
- `PUT /api/v1/patients/{id}` - Update patient

### Orders

- `GET /api/v1/orders` - List orders
- `POST /api/v1/orders` - Create order (auto-generates samples)
- `GET /api/v1/orders/{id}` - Get order details

### Samples

- `GET /api/v1/samples` - List samples
- `PATCH /api/v1/samples/{id}/collect` - Collect sample
- `PATCH /api/v1/samples/{id}/reject` - Reject sample

### Results

- `GET /api/v1/results/pending-entry` - Get tests needing results
- `POST /api/v1/results/{order_id}/tests/{test_code}` - Enter results
- `POST /api/v1/results/{order_id}/tests/{test_code}/validate` - Validate results

### Tests

- `GET /api/v1/tests` - List test catalog
- `GET /api/v1/tests/{code}` - Get test details

### Users (Admin only)

- `GET /api/v1/users` - List users
- `POST /api/v1/users` - Create user

## Default User

Create a default admin user by running:

```python
from app.database import SessionLocal
from app.models.user import User
from app.core.security import get_password_hash
from app.schemas.enums import UserRole

db = SessionLocal()
admin = User(
    id="USR-001",
    username="admin",
    hashed_password=get_password_hash("admin123"),
    name="System Administrator",
    role=UserRole.ADMIN
)
db.add(admin)
db.commit()
```

## Frontend Integration

Update your frontend `.env.development`:

```
VITE_API_BASE_URL=http://localhost:8000/api
```

Remove all localStorage code from the frontend as the backend now handles all data persistence.
