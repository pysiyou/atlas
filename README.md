# Atlas

Python runs in your **conda** env (e.g. `atlas`). Poetry installs into that env (`backend/poetry.toml`: `create = false`), not into `backend/.venv`.

## First time

```bash
conda activate atlas
npm run setup:api
npm run setup:web
```

Copy `backend/.env.example` to `backend/.env` and set `DATABASE_URL` and `SECRET_KEY`.

## Every day

```bash
conda activate atlas
npm run dev:api    # terminal 1 — http://127.0.0.1:8000
npm run dev:web    # terminal 2 — http://localhost:5173
```

`curl -s http://127.0.0.1:8000/health` should return `{"status":"healthy"}` before you rely on the UI.

## Clinical identifiers

MRN, order filler, accession, employee, and related IDs are defined in [`contracts/entity-ids.json`](contracts/entity-ids.json). See [`docs/clinical-identifiers.md`](docs/clinical-identifiers.md) for architecture decisions and the change runbook.

From `frontend/` after backend schema changes:

```bash
npm run codegen:openapi
```