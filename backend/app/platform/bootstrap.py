"""Dev database bootstrap CLI."""
from __future__ import annotations

from app.platform.database import init_db

if __name__ == "__main__":
    init_db()