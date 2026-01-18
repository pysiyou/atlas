"""
Generate test data from the test catalog JSON file
"""
import json
import os
from sqlalchemy.orm import Session
from app.models.test import Test
# Note: ContainerType and ContainerTopColor might be strings or enums in the model, 
# but simply mapping from JSON strings usually works if they are just strings in DB or matched Enums. 
# Looking at the model definition, they are JSON arrays, so lists of strings are expected.

def load_test_catalog():
    """Load the test catalog from the JSON file"""
    file_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'app', 'data', 'test-catalog.json')
    with open(file_path, 'r') as f:
        return json.load(f)

def generate_tests(db: Session):
    """Generate and insert tests into the database"""
    print("🧪 Generating tests from catalog...")
    
    try:
        data = load_test_catalog()
        tests_data = data.get('tests', [])
        
        tests_created = 0
        
        for item in tests_data:
            # Map JSON fields to Test model fields
            test_data = {
                "code": item.get("test_code"),
                "name": item.get("display_name"), # Using display_name for name as well
                "displayName": item.get("display_name"),
                "synonyms": item.get("synonyms", []),
                "category": item.get("mapped_category"),
                
                # Pricing and timing
                "price": float(item.get("price", 0)),
                "turnaroundTimeHours": item.get("turnaround_time_hours", 24),
                
                # Sample requirements
                "sampleType": item.get("mapped_sample_type"),
                "sampleVolume": item.get("sample_volume_description"),
                "minimumVolume": float(item.get("sample", {}).get("minimum_volume_ml", 0) or 0),
                "optimalVolume": None, # Not explicitly in JSON, usually related to min volume
                
                # Container requirements
                "containerTypes": item.get("container_types", []),
                "containerTopColors": item.get("container_top_colors", []),
                "numberOfContainers": 1, # Default
                "containerDescription": item.get("sample", {}).get("container"),
                
                # Special requirements
                "specialRequirements": None, # Could be mapped if available
                "fastingRequired": item.get("sample", {}).get("fasting_required", False),
                "collectionNotes": item.get("sample", {}).get("collection_notes"),
                "rejectionCriteria": item.get("sample", {}).get("rejection_criteria", []),
                
                # Reference ranges and parameters
                # The model has referenceRanges (JSON) and resultItems (JSON). 
                # The JSON catalog has result_items which contains reference_range.
                # We can store result_items directly or transform them.
                "resultItems": item.get("result_items", []),
                "referenceRanges": [], # We'll keep this empty or extract if needed, but resultItems has it.
                
                # Additional catalog fields
                "panels": item.get("panels", []),
                "loincCodes": item.get("loinc_codes", []),
                "methodology": item.get("method_common"),
                "confidence": item.get("confidence"),
                "notes": item.get("notes"),
                
                "isActive": True
            }
            
            # Check if test exists
            existing = db.query(Test).filter(Test.code == test_data["code"]).first()
            if existing:
                # Update existing
                for key, value in test_data.items():
                    setattr(existing, key, value)
            else:
                # Create new
                test = Test(**test_data)
                db.add(test)
            
            tests_created += 1
            
        db.commit()
        print(f"✅ Successfully processed {tests_created} tests from catalog!")
        
    except Exception as e:
        print(f"\n❌ Error generating tests: {e}")
        db.rollback()
        raise
