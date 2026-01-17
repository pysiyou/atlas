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


def generate_samples_for_order(order_id: str, db: Session, created_by: str) -> List[Sample]:
    """
    Generate samples for an order based on its tests
    Groups tests by sample type and creates one sample per type
    """
    # Get order and its tests
    order = db.query(Order).filter(Order.order_id == order_id).first()
    if not order:
        raise ValueError(f"Order {order_id} not found")
    
    order_tests = db.query(OrderTest).filter(OrderTest.order_id == order_id).all()
    if not order_tests:
        return []
    
    # Group tests by sample type
    sample_groups: Dict[str, List[OrderTest]] = {}
    
    for order_test in order_tests:
        # Get test details from catalog
        test = db.query(Test).filter(Test.code == order_test.test_code).first()
        if not test:
            continue
        
        sample_type = test.sample_type
        if sample_type not in sample_groups:
            sample_groups[sample_type] = []
        sample_groups[sample_type].append((order_test, test))
    
    # Create samples
    samples = []
    for sample_type, test_list in sample_groups.items():
        # Calculate required volume (sum of minimum volumes)
        total_volume = 0.0
        test_codes = []
        container_types_set = set()
        container_colors_set = set()
        
        for order_test, test in test_list:
            test_codes.append(test.code)
            if test.minimum_volume:
                total_volume += test.minimum_volume
            
            # Collect container requirements
            if test.container_types:
                container_types_set.update(test.container_types)
            if test.container_top_colors:
                container_colors_set.update(test.container_top_colors)
        
        # Create sample
        sample_id = generate_id("sample", db)
        sample = Sample(
            sample_id=sample_id,
            order_id=order_id,
            sample_type=sample_type,
            status=SampleStatus.PENDING,
            test_codes=test_codes,
            required_volume=total_volume,
            priority=order.priority,
            required_container_types=list(container_types_set),
            required_container_colors=list(container_colors_set),
            created_by=created_by,
            updated_by=created_by,
        )
        
        db.add(sample)
        samples.append(sample)
    
    db.commit()
    return samples
