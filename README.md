# Atlas Laboratory Management System

Full-stack laboratory management system with React frontend and FastAPI backend.

## Project Structure

```
Atlas/
├── frontend/          # React + TypeScript frontend
└── backend/           # FastAPI Python backend
```

## Quick Start

### Backend

```bash
cd backend
poetry install
cp .env.example .env
poetry run python init_db.py
poetry run uvicorn app.main:app --reload
```

Backend runs at `http://localhost:8000`

- API Docs: `http://localhost:8000/docs`

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at `http://localhost:5173`

## Default Credentials

- Username: `admin`
- Password: `admin123`

## Features

- Patient management
- Test catalog
- Order management with automatic sample generation
- Sample collection and tracking
- Result entry and validation
- User management with role-based access control
