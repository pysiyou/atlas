"""
Simulation middleware for backdating operations.

When SIMULATION_MODE=true, reads the X-Simulated-Date header from incoming
requests and sets the simulated time context variable so all services use the
historical timestamp instead of datetime.now().
"""
import os
from datetime import datetime, timezone

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response

from app.utils.time_utils import set_simulated_time, clear_simulated_time

HEADER_NAME = "X-Simulated-Date"


def is_simulation_mode() -> bool:
    return os.environ.get("SIMULATION_MODE", "").lower() in ("true", "1", "yes")


class SimulationTimeMiddleware(BaseHTTPMiddleware):
    """
    Middleware that intercepts X-Simulated-Date header and overrides
    the clock for the duration of the request.

    Only active when SIMULATION_MODE=true environment variable is set.
    """

    async def dispatch(self, request: Request, call_next) -> Response:
        if not is_simulation_mode():
            return await call_next(request)

        header_value = request.headers.get(HEADER_NAME)
        if header_value:
            try:
                dt = datetime.fromisoformat(header_value)
                if dt.tzinfo is None:
                    dt = dt.replace(tzinfo=timezone.utc)
                set_simulated_time(dt)
            except (ValueError, TypeError):
                pass  # ignore malformed header, use real time

        try:
            response = await call_next(request)
        finally:
            clear_simulated_time()

        return response
