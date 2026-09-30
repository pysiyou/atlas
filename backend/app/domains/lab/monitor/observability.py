"""Structured timing logs for lab read paths (board + worklists)."""
from __future__ import annotations

import logging
import time
from collections.abc import Iterator
from contextlib import contextmanager
from typing import Any

logger = logging.getLogger(__name__)


@contextmanager
def log_lab_read(
    endpoint: str,
    *,
    page: int | None = None,
    page_size: int | None = None,
    include_supervisor: bool | None = None,
    detail: str | None = None,
) -> Iterator[dict[str, Any]]:
    """
    Context manager that records duration_ms, rows_loaded, rows_returned on exit.

    Callers set metrics via the yielded dict, e.g. metrics["rows_loaded"] = n.
    """
    metrics: dict[str, Any] = {
        "rows_loaded": None,
        "rows_returned": None,
    }
    started = time.perf_counter()
    try:
        yield metrics
    finally:
        duration_ms = round((time.perf_counter() - started) * 1000, 2)
        extra = {
            "endpoint": endpoint,
            "duration_ms": duration_ms,
            "rows_loaded": metrics.get("rows_loaded"),
            "rows_returned": metrics.get("rows_returned"),
        }
        if page is not None:
            extra["page"] = page
        if page_size is not None:
            extra["page_size"] = page_size
        if include_supervisor is not None:
            extra["include_supervisor"] = include_supervisor
        if detail is not None:
            extra["detail"] = detail
        logger.info("lab_read %s", extra)
