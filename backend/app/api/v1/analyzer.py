"""
Analyzer Integration API Routes

Endpoints for receiving results from laboratory analyzers.
Supports HL7 v2.x message format.
"""
from fastapi import APIRouter, Depends, HTTPException, status, Header
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

from app.database import get_db
from app.models.order import Order, OrderTest
from app.models.sample import Sample
from app.models.test import Test
from app.schemas.enums import TestStatus
from app.services.lab_operations import LabOperationsService, LabOperationError
from app.middleware.hl7_parser import HL7Parser, HL7ParseError, AnalyzerResultAdapter

router = APIRouter()

# System user ID for analyzer-submitted results
ANALYZER_USER_ID = 0


class HL7MessageRequest(BaseModel):
    """Request body for HL7 message submission"""
    message: str
    analyzer_id: Optional[str] = None


class AnalyzerResultRequest(BaseModel):
    """Request body for direct JSON result submission"""
    specimen_id: str
    test_code: str
    results: dict
    analyzer_id: Optional[str] = None
    observation_datetime: Optional[datetime] = None


class AnalyzerResultResponse(BaseModel):
    """Response for analyzer result submission"""
    success: bool
    message: str
    order_id: Optional[int] = None
    test_id: Optional[int] = None
    status: Optional[str] = None
    warnings: List[str] = []


def verify_analyzer_auth(x_analyzer_key: str = Header(None)) -> bool:
    """
    Verify analyzer authentication.
    In production, this should check against configured analyzer keys.
    """
    # For now, accept any non-empty key
    # TODO: Implement proper analyzer authentication
    if not x_analyzer_key:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing analyzer authentication key"
        )
    return True


@router.post("/analyzer/hl7", response_model=AnalyzerResultResponse)
async def receive_hl7_result(
    request: HL7MessageRequest,
    db: Session = Depends(get_db),
    authenticated: bool = Depends(verify_analyzer_auth)
):
    """
    Receive and process an HL7 ORU message from a laboratory analyzer.

    The message is parsed, validated, and results are entered into the
    matching order test using the standard lab operations service.

    This ensures all business logic (state machine, validation, audit)
    is applied consistently.
    """
    warnings = []

    # Parse the HL7 message
    parser = HL7Parser()
    try:
        analyzer_result = parser.parse(request.message)
    except HL7ParseError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to parse HL7 message: {str(e)}"
        )

    # Find the matching order test by specimen ID
    specimen_id = analyzer_result.specimen_id
    if not specimen_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No specimen ID found in HL7 message"
        )

    # Try to find the sample by specimen ID
    sample = db.query(Sample).filter(Sample.sampleId == int(specimen_id)).first()
    if not sample:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Sample {specimen_id} not found"
        )

    # Find the order test
    test_code = analyzer_result.test_code
    if not test_code:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No test code found in HL7 message"
        )

    order_test = db.query(OrderTest).filter(
        OrderTest.orderId == sample.orderId,
        OrderTest.testCode == test_code,
        OrderTest.status == TestStatus.SAMPLE_COLLECTED
    ).first()

    if not order_test:
        # Check if already resulted
        existing = db.query(OrderTest).filter(
            OrderTest.orderId == sample.orderId,
            OrderTest.testCode == test_code
        ).first()

        if existing and existing.status in [TestStatus.RESULTED, TestStatus.VALIDATED]:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Test {test_code} already has results"
            )

        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No pending test {test_code} found for sample {specimen_id}"
        )

    # Get test definition for validation
    test_def = db.query(Test).filter(Test.code == test_code).first()
    result_items = test_def.resultItems if test_def else []

    # Convert analyzer results to internal format
    adapter = AnalyzerResultAdapter()

    # Validate against catalog
    validation_errors = adapter.validate_against_catalog(analyzer_result, result_items)
    if validation_errors:
        warnings.extend(validation_errors)

    # Convert to internal format
    internal_results = adapter.to_internal_format(analyzer_result, result_items)

    # Enter results using the standard service (applies all validation and audit)
    service = LabOperationsService(db)
    try:
        updated_test = service.enter_results(
            order_id=sample.orderId,
            test_code=test_code,
            user_id=ANALYZER_USER_ID,
            results=internal_results,
            technician_notes=f"Auto-entered from analyzer {request.analyzer_id or analyzer_result.analyzer_id or 'unknown'}"
        )
    except LabOperationError as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)

    return AnalyzerResultResponse(
        success=True,
        message=f"Results entered for test {test_code}",
        order_id=sample.orderId,
        test_id=updated_test.id,
        status=updated_test.status.value,
        warnings=warnings
    )


@router.post("/analyzer/json", response_model=AnalyzerResultResponse)
async def receive_json_result(
    request: AnalyzerResultRequest,
    db: Session = Depends(get_db),
    authenticated: bool = Depends(verify_analyzer_auth)
):
    """
    Receive results in JSON format from an analyzer.

    This is an alternative to HL7 for analyzers that support
    direct JSON integration.
    """
    warnings = []

    # Find the sample
    sample = db.query(Sample).filter(Sample.sampleId == int(request.specimen_id)).first()
    if not sample:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Sample {request.specimen_id} not found"
        )

    # Find the order test
    order_test = db.query(OrderTest).filter(
        OrderTest.orderId == sample.orderId,
        OrderTest.testCode == request.test_code,
        OrderTest.status == TestStatus.SAMPLE_COLLECTED
    ).first()

    if not order_test:
        existing = db.query(OrderTest).filter(
            OrderTest.orderId == sample.orderId,
            OrderTest.testCode == request.test_code
        ).first()

        if existing and existing.status in [TestStatus.RESULTED, TestStatus.VALIDATED]:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Test {request.test_code} already has results"
            )

        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No pending test {request.test_code} found for sample {request.specimen_id}"
        )

    # Enter results using the standard service
    service = LabOperationsService(db)
    try:
        updated_test = service.enter_results(
            order_id=sample.orderId,
            test_code=request.test_code,
            user_id=ANALYZER_USER_ID,
            results=request.results,
            technician_notes=f"Auto-entered from analyzer {request.analyzer_id or 'unknown'}"
        )
    except LabOperationError as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)

    return AnalyzerResultResponse(
        success=True,
        message=f"Results entered for test {request.test_code}",
        order_id=sample.orderId,
        test_id=updated_test.id,
        status=updated_test.status.value,
        warnings=warnings
    )


@router.get("/analyzer/pending/{analyzer_id}")
async def get_pending_samples(
    analyzer_id: str,
    db: Session = Depends(get_db),
    authenticated: bool = Depends(verify_analyzer_auth)
):
    """
    Get samples pending analysis for a specific analyzer.

    This can be used by analyzers to poll for work.
    """
    # Get all samples that are collected and have tests ready for this analyzer
    # In a real implementation, you'd filter by analyzer capabilities
    pending_tests = db.query(OrderTest).filter(
        OrderTest.status == TestStatus.SAMPLE_COLLECTED
    ).limit(100).all()

    results = []
    for test in pending_tests:
        sample = db.query(Sample).filter(Sample.sampleId == test.sampleId).first()
        if sample:
            results.append({
                "specimen_id": sample.sampleId,
                "order_id": test.orderId,
                "test_code": test.testCode,
                "sample_type": sample.sampleType.value if sample.sampleType else None,
                "collected_at": sample.collectedAt.isoformat() if sample.collectedAt else None
            })

    return {"pending_samples": results, "count": len(results)}
