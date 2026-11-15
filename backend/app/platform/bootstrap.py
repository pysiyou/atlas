"""Dev database bootstrap: drop and recreate empty tables. No seed data."""
from __future__ import annotations

import app.domains.registry  # noqa: F401 — register all ORM models before create_all
from app.platform.database import Base, engine


def init_db() -> None:
    """Drop every table and recreate the schema with no rows."""
    print("Initializing database...")
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    print("Tables created (empty). Create the first administrator from the login screen.")


if __name__ == "__main__":
    init_db()
