"""
Sample Generator Service
Analyzes order tests and generates required samples
"""
from typing import List, Dict
from sqlalchemy.orm import Session
from app.models import Order, OrderTest, Test, Sample
from app.schemas.enums import SampleStatus, PriorityLevel
from app.services.id_generator import generate_id
from datetime import datetime


def generate_samples_for_order(orderId: str, db: Session, createdBy: str) -> List[Sample]:
    """
    Generate samples for an order based on its tests
    Groups tests by sample type and creates one sample per type
    """
    # Get order and its tests
    order = db.query(Order).filter(Order.orderId == orderId).first()
    if not order:
        raise ValueError(f"Order {orderId} not found")

    order_tests = db.query(OrderTest).filter(OrderTest.orderId == orderId).all()
    if not order_tests:
        return []

    # Group tests by sample type
    sample_groups: Dict[str, List[OrderTest]] = {}

    for order_test in order_tests:
        # Get test details from catalog
        test = db.query(Test).filter(Test.code == order_test.testCode).first()
        if not test:
            continue

        sampleType = test.sampleType
        if sampleType not in sample_groups:
            sample_groups[sampleType] = []
        sample_groups[sampleType].append((order_test, test))

    # Create samples
    samples = []
    for sampleType, test_list in sample_groups.items():
        # Calculate required volume (sum of minimum volumes)
        total_volume = 0.0
        testCodes = []
        container_types_set = set()
        container_colors_set = set()

        for order_test, test in test_list:
            testCodes.append(test.code)
            if test.minimumVolume:
                total_volume += test.minimumVolume

            # Collect container requirements
            if test.containerTypes:
                container_types_set.update(test.containerTypes)
            if test.containerTopColors:
                container_colors_set.update(test.containerTopColors)

        # Create sample
        sampleId = generate_id("sample", db)
        sample = Sample(
            sampleId=sampleId,
            orderId=orderId,
            sampleType=sampleType,
            status=SampleStatus.PENDING,
            testCodes=testCodes,
            requiredVolume=total_volume,
            priority=order.priority,
            requiredContainerTypes=list(container_types_set),
            requiredContainerColors=list(container_colors_set),
            # Recollection tracking - initialize with defaults
            isRecollection=False,
            recollectionAttempt=1,  # First collection is attempt 1
            rejectionHistory=[],  # Empty array for new samples
            createdBy=createdBy,
            updatedBy=createdBy,
        )

        db.add(sample)
        db.flush()  # Flush to make this sample's ID visible for next sample
        samples.append(sample)

    # Note: Caller is responsible for committing the transaction
    return samples
