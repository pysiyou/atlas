"""
Migrate existing rejected samples to use rejectionHistory structure
This script consolidates rejection data into the rejectionHistory array
"""
import json
import sys
from pathlib import Path

# Add parent directory to path to import app modules
sys.path.insert(0, str(Path(__file__).parent.parent))

from sqlalchemy import text
from app.database import engine


def migrate_rejection_data():
    """
    Migrate existing rejection data to rejectionHistory array
    For each rejected sample, create a rejection record in the history
    """
    
    print(f"Connecting to database: {engine.url}")
    
    with engine.connect() as conn:
        try:
            # Find all rejected samples that have rejection data but no history
            result = conn.execute(text("""
                SELECT "sampleId", "rejectedAt", "rejectedBy", "rejectionReasons", 
                       "rejectionNotes", "recollectionRequired"
                FROM samples
                WHERE status = 'REJECTED' 
                AND "rejectedAt" IS NOT NULL
                AND ("rejectionHistory" IS NULL OR "rejectionHistory" = '[]'::jsonb)
            """))
            
            rejected_samples = result.fetchall()
            
            if not rejected_samples:
                print("✓ No samples need migration")
                return
            
            print(f"Found {len(rejected_samples)} rejected samples to migrate")
            
            migrated_count = 0
            for sample in rejected_samples:
                sample_id, rejected_at, rejected_by, rejection_reasons, rejection_notes, recollection_required = sample
                
                # Parse rejectionReasons if it's a JSON string
                if rejection_reasons:
                    reasons = rejection_reasons if isinstance(rejection_reasons, list) else []
                else:
                    reasons = []
                
                # Create rejection record
                rejection_record = {
                    "rejectedAt": rejected_at.isoformat() if rejected_at else None,
                    "rejectedBy": rejected_by or "unknown",
                    "rejectionReasons": reasons,
                    "rejectionNotes": rejection_notes,
                    "recollectionRequired": bool(recollection_required)
                }
                
                # Create history array with this single record
                rejection_history = [rejection_record]
                
                # Update the sample - use simple parameter binding
                history_json = json.dumps(rejection_history)
                conn.execute(
                    text('UPDATE samples SET "rejectionHistory" = :history WHERE "sampleId" = :sample_id'),
                    {"history": history_json, "sample_id": sample_id}
                )
                
                migrated_count += 1
                print(f"  ✓ Migrated {sample_id}")
            
            conn.commit()
            print(f"\n✓ Successfully migrated {migrated_count} samples")
            
            # Now handle recollection samples - consolidate them
            print("\nConsolidating recollection samples...")
            consolidate_recollection_samples(conn)
            
        except Exception as e:
            conn.rollback()
            print(f"✗ Error during migration: {e}")
            raise


def consolidate_recollection_samples(conn):
    """
    Find samples that are recollections and consolidate their rejection history
    into the original sample
    """
    
    # Find all samples that are recollections
    result = conn.execute(text("""
        SELECT "sampleId", "originalSampleId", "rejectedAt", "rejectedBy", 
               "rejectionReasons", "rejectionNotes", "recollectionRequired",
               status
        FROM samples
        WHERE "isRecollection" = true 
        AND "originalSampleId" IS NOT NULL
    """))
    
    recollection_samples = result.fetchall()
    
    if not recollection_samples:
        print("  ✓ No recollection samples to consolidate")
        return
    
    print(f"  Found {len(recollection_samples)} recollection samples")
    
    consolidated_count = 0
    
    for recoll_sample in recollection_samples:
        (recoll_id, original_id, rejected_at, rejected_by, 
         rejection_reasons, rejection_notes, recollection_required, status) = recoll_sample
        
        # Get the original sample
        original_result = conn.execute(text("""
            SELECT "rejectionHistory"
            FROM samples
            WHERE "sampleId" = :original_id
        """), {"original_id": original_id})
        
        original = original_result.fetchone()
        if not original:
            print(f"  ⚠ Original sample {original_id} not found for recollection {recoll_id}")
            continue
        
        # If this recollection sample was also rejected, add it to history
        if status == 'REJECTED' and rejected_at:
            # Parse existing history
            existing_history = original[0] if original[0] else []
            
            # Parse rejectionReasons
            if rejection_reasons:
                reasons = rejection_reasons if isinstance(rejection_reasons, list) else []
            else:
                reasons = []
            
            # Add this rejection to the history
            rejection_record = {
                "rejectedAt": rejected_at.isoformat() if rejected_at else None,
                "rejectedBy": rejected_by or "unknown",
                "rejectionReasons": reasons,
                "rejectionNotes": rejection_notes,
                "recollectionRequired": bool(recollection_required)
            }
            
            existing_history.append(rejection_record)
            
            # Update original sample with consolidated history
            history_json = json.dumps(existing_history)
            conn.execute(
                text('UPDATE samples SET "rejectionHistory" = :history WHERE "sampleId" = :original_id'),
                {"history": history_json, "original_id": original_id}
            )
            
            consolidated_count += 1
            print(f"  ✓ Consolidated rejection from {recoll_id} into {original_id}")
    
    if consolidated_count > 0:
        conn.commit()
        print(f"\n  ✓ Consolidated {consolidated_count} recollection rejections")


if __name__ == "__main__":
    print("=" * 60)
    print("Sample Rejection History Migration")
    print("=" * 60)
    print()
    
    migrate_rejection_data()
    
    print()
    print("=" * 60)
    print("Migration Complete!")
    print("=" * 60)

