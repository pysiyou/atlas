# Atlas Backend - FastAPI Laboratory Management System

## Quick Start

### 1. Start PostgreSQL Database

Using Docker (recommended):

```bash
cd backend
docker-compose up -d
```

Or install PostgreSQL locally and create database:

```sql
CREATE DATABASE atlas_lab;
CREATE USER atlas WITH PASSWORD 'atlas123';
GRANT ALL PRIVILEGES ON DATABASE atlas_lab TO atlas;
```

### 2. Install Dependencies

```bash
cd backend
poetry install
```

### 3. Configure Environment

Copy `.env.example` to `.env` (already configured for local PostgreSQL):

```bash
cp .env.example .env
```

### 4. Initialize Database

```bash
poetry run python init_db.py
```

### 5. Seed Example Data (Optional)

```bash
poetry run python seed_data.py
```

This creates:

- 4 users (admin, receptionist, labtech, labtech_plus)
- 4 test types (CBC, Glucose, Lipid Panel, Urinalysis)
- 2 example patients
- 2 example orders

### 6. Run the Server

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
