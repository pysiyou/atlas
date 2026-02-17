"""
One-off migration: add users.updated_at column.
Run from backend dir: poetry run python scripts/add_users_updated_at.py
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from sqlalchemy import text
from app.database import engine


def main() -> None:
    with engine.connect() as conn:
        conn.execute(text("""
            ALTER TABLE users
            ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL;
        """))
        conn.commit()
    print("Added users.updated_at column.")


if __name__ == "__main__":
    main()
