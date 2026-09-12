"""Analyzer Integration API Routes."""
from fastapi import APIRouter, Depends, Header, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.analyzer import (
    AnalyzerResultRequest,
    AnalyzerResultResponse,
    HL7MessageRequest,
)
from app.services.lab.analyzer_ingest import AnalyzerIngestService

router = APIRouter()


def verify_analyzer_auth(x_analyzer_key: str = Header(None)) -> bool:
    if not x_analyzer_key:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing analyzer authentication key",
        )
    return True


@router.post("/analyzer/hl7", response_model=AnalyzerResultResponse)
async def receive_hl7_result(
    request: HL7MessageRequest,
    db: Session = Depends(get_db),
    authenticated: bool = Depends(verify_analyzer_auth),
):
    return AnalyzerIngestService(db).ingest_hl7(request)


@router.post("/analyzer/json", response_model=AnalyzerResultResponse)
async def receive_json_result(
    request: AnalyzerResultRequest,
    db: Session = Depends(get_db),
    authenticated: bool = Depends(verify_analyzer_auth),
):
    return AnalyzerIngestService(db).ingest_json(request)


@router.get("/analyzer/pending/{analyzer_id}")
async def get_pending_samples(
    analyzer_id: str,
    db: Session = Depends(get_db),
    authenticated: bool = Depends(verify_analyzer_auth),
):
    return AnalyzerIngestService(db).list_pending(analyzer_id)
