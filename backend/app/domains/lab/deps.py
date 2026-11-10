"""FastAPI dependencies for lab domain services."""

from __future__ import annotations

from app.domains.lab.monitor.worklist_service import LabWorklistService
from app.domains.lab.results import ResultQueryService
from app.domains.lab.specimen import SpecimenQueryService
from app.domains.lab.workflow.service import LabOperationsService
from app.platform.database import get_db
from fastapi import Depends
from sqlalchemy.orm import Session


def get_lab_operations_service(db: Session = Depends(get_db)) -> LabOperationsService:
    return LabOperationsService(db)


def get_lab_worklist_service(db: Session = Depends(get_db)) -> LabWorklistService:
    return LabWorklistService(db)


def get_result_query_service(db: Session = Depends(get_db)) -> ResultQueryService:
    return ResultQueryService(db)


def get_specimen_query_service(db: Session = Depends(get_db)) -> SpecimenQueryService:
    return SpecimenQueryService(db)
