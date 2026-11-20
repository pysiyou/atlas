"""
Temporary console debug logging for Atlas backend.

Output matches uvicorn/FastAPI console style (colored level prefix, access lines).
Replace with structured logging later. Set env ``DEBUG_CONSOLE_LOG=0`` to disable.
"""
from __future__ import annotations

import http
import logging
import os
import sys
import traceback
from typing import Any

import click

_LEVEL = {
    "debug": ("DEBUG", logging.DEBUG),
    "info": ("INFO", logging.INFO),
    "warn": ("WARNING", logging.WARNING),
    "error": ("ERROR", logging.ERROR),
}

_LEVEL_COLORS = {
    logging.DEBUG: "cyan",
    logging.INFO: "green",
    logging.WARNING: "yellow",
    logging.ERROR: "red",
}


def _enabled() -> bool:
    return os.getenv("DEBUG_CONSOLE_LOG", "1").strip().lower() not in ("0", "false", "no", "off")


def _use_colors() -> bool:
    if os.getenv("NO_COLOR", "").strip():
        return False
    force = os.getenv("DEBUG_CONSOLE_LOG_COLORS", "").strip().lower()
    if force in ("1", "true", "yes", "on"):
        return True
    if force in ("0", "false", "no", "off"):
        return False
    return sys.stderr.isatty()


def _level_prefix(level: str) -> str:
    name, level_no = _LEVEL.get(level, ("INFO", logging.INFO))
    sep = " " * (8 - len(name))
    if _use_colors():
        color = _LEVEL_COLORS.get(level_no)
        if color:
            name = click.style(name, fg=color)
    return f"{name}:{sep}"


def _workflow_tag(workflow: str) -> str:
    text = f"atlas:{workflow}"
    if _use_colors():
        return click.style(text, fg="bright_black")
    return text


def _format_ctx(ctx: dict[str, Any]) -> str:
    if not ctx:
        return ""
    parts: list[str] = []
    for key, value in ctx.items():
        if value is None:
            continue
        if isinstance(value, dict | list) and len(str(value)) > 120:
            text = f"{key}=<{type(value).__name__} len={len(value)}>"
        else:
            text = f"{key}={value!r}"
        if _use_colors():
            text = click.style(text, fg="bright_black")
        parts.append(text)
    return f" {' '.join(parts)}" if parts else ""


def _status_text(status_code: int) -> str:
    try:
        phrase = http.HTTPStatus(status_code).phrase
    except ValueError:
        phrase = ""
    return f"{status_code} {phrase}".strip()


def _color_status(status_code: int) -> str:
    text = _status_text(status_code)
    if not _use_colors():
        return text
    bucket = status_code // 100
    colors: dict[int, str] = {
        1: "bright_white",
        2: "green",
        3: "yellow",
        4: "red",
        5: "bright_red",
    }
    color = colors.get(bucket, "white")
    return click.style(text, fg=color)


def emit(workflow: str, level: str, message: str, **ctx: Any) -> None:
    if not _enabled():
        return
    line = f"{_level_prefix(level)}{_workflow_tag(workflow)} {message}{_format_ctx(ctx)}"
    print(line, file=sys.stderr, flush=True)


def emit_access(level: str, message: str, **ctx: Any) -> None:
    """Uvicorn-style access line (no atlas workflow tag)."""
    if not _enabled():
        return
    line = f"{_level_prefix(level)}{message}{_format_ctx(ctx)}"
    print(line, file=sys.stderr, flush=True)


def debug(workflow: str, message: str, **ctx: Any) -> None:
    emit(workflow, "debug", message, **ctx)


def info(workflow: str, message: str, **ctx: Any) -> None:
    emit(workflow, "info", message, **ctx)


def warn(workflow: str, message: str, **ctx: Any) -> None:
    emit(workflow, "warn", message, **ctx)


def error(workflow: str, message: str, **ctx: Any) -> None:
    emit(workflow, "error", message, **ctx)


def exception(workflow: str, message: str, *, exc: BaseException | None = None) -> None:
    """Log a failure; includes exception type and message when provided."""
    ctx: dict[str, Any] = {}
    if exc is not None:
        ctx["exc"] = f"{type(exc).__name__}: {exc}"
    emit(workflow, "error", message, **ctx)
    if exc is not None and _enabled():
        tb = traceback.format_exc()
        if tb and tb.strip() != "NoneType: None":
            if _use_colors():
                tb = click.style(tb, fg="bright_black")
            print(tb, file=sys.stderr, flush=True)


# --- HTTP (uvicorn access-log style) ---


def _bold_request_line(method: str, path: str) -> str:
    line = f"{method} {path} HTTP/1.1"
    if _use_colors():
        return click.style(line, bold=True)
    return line


def http_request(method: str, path: str, *, client_addr: str = "-", **ctx: Any) -> None:
    arrow = "→"
    if _use_colors():
        arrow = click.style("→", fg="cyan")
    target = f"{method} {path}"
    if _use_colors():
        target = click.style(target, bold=True)
    info("http", f"{arrow} {target}", client=client_addr, **ctx)


def http_response(
    method: str,
    path: str,
    status_code: int,
    duration_ms: float,
    *,
    client_addr: str = "-",
    **ctx: Any) -> None:
    request_line = _bold_request_line(method, path)
    status = _color_status(status_code)
    duration = f"{duration_ms:.1f}ms"
    if _use_colors():
        duration = click.style(duration, fg="bright_black")
    message = f'{client_addr} - "{request_line}" {status} ({duration})'
    level = "info" if status_code < 500 else "error"
    emit_access(level, message, **ctx)


# --- Lab mutations (single choke point) ---


def lab_mutation(action: str, phase: str, **ctx: Any) -> None:
    level = {"failed": "error", "rejected": "warn"}.get(phase, "info")
    emit("lab.mutation", level, f"{action} {phase}", **ctx)


# --- Business workflows ---


def workflow_start(name: str, **ctx: Any) -> None:
    info(name, "start", **ctx)


def workflow_ok(name: str, **ctx: Any) -> None:
    info(name, "ok", **ctx)


def workflow_fail(name: str, message: str, **ctx: Any) -> None:
    warn(name, message, **ctx)