"""Lab domain constants not generated from contracts."""

from __future__ import annotations

# System actor for analyzer ingest; not a login account.
ANALYZER_USER_ID = "100000"


def is_analyzer_user_id(user_id: str | None) -> bool:
    """True when results were entered by the analyzer ingest path, not a human login."""
    if user_id is None:
        return False
    return str(user_id).strip() == ANALYZER_USER_ID
