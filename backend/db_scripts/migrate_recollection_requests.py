"""
Create recollection_requests table for supervisor-gated redraw workflow.

Usage:
  cd backend && python -m db_scripts.migrate_recollection_requests
"""
from app.database import engine
from app.models.recollection_request import RecollectionRequest


def migrate() -> None:
    RecollectionRequest.__table__.create(bind=engine, checkfirst=True)
    print("recollection_requests table ready.")


if __name__ == "__main__":
    migrate()
