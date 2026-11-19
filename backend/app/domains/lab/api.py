"""Lab HTTP entry — mounts area routers under /lab."""
from __future__ import annotations

from app.domains.lab.integration.api import router as integration_router
from app.domains.lab.monitor.api import router as monitor_router
from app.domains.lab.quality.api import router as quality_router
from app.domains.lab.results.api import router as results_router
from app.domains.lab.specimen.api import router as specimen_router
from fastapi import APIRouter

router = APIRouter(prefix="/lab", tags=["lab"])
router.include_router(specimen_router)
router.include_router(results_router)
router.include_router(monitor_router)
router.include_router(quality_router)
router.include_router(integration_router)
