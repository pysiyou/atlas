"""
Simulation-aware time utility.

When SIMULATION_MODE is enabled, API requests can include an X-Simulated-Date
header to override datetime.now(). This allows the simulation script to
backdate operations while preserving all business logic and side effects.

Usage in services:
    from app.utils.time_utils import get_now
    timestamp = get_now()  # returns simulated or real UTC time
"""
from contextvars import ContextVar
from datetime import datetime, timezone
from typing import Optional

_simulated_time: ContextVar[Optional[datetime]] = ContextVar(
    "_simulated_time", default=None
)


def get_now() -> datetime:
    """Return the current UTC time, or the simulated time if set."""
    sim = _simulated_time.get()
    if sim is not None:
        return sim
    return datetime.now(timezone.utc)


def set_simulated_time(dt: Optional[datetime]) -> None:
    """Set the simulated time for the current request context."""
    _simulated_time.set(dt)


def clear_simulated_time() -> None:
    """Clear the simulated time for the current request context."""
    _simulated_time.set(None)
