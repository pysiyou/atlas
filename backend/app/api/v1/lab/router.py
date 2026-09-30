"""Aggregated lab API router."""

from fastapi import APIRouter

from app.api.v1.lab import (
    analyzer,
    critical_values,
    quality_issues,
    recollection_requests,
    results,
    samples,
    worklists,
)

router = APIRouter(prefix="/lab", tags=["lab"])

router.include_router(samples.router)
router.include_router(results.router)
router.include_router(worklists.router)
router.include_router(critical_values.router)
router.include_router(analyzer.router)
router.include_router(quality_issues.router)
router.include_router(recollection_requests.router)
