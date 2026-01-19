"""
Add rejectionHistory column to samples table
"""
import sys
from pathlib import Path

# Add parent directory to path to import app modules
sys.path.insert(0, str(Path(__file__).parent.parent))

from sqlalchemy import text
from app.database import engine


def migrate():
    """Add rejectionHistory column to samples table"""
    
    print(f"Connecting to database: {engine.url}")
    
    with engine.connect() as conn:
        try:
            # Check if column already exists
            result = conn.execute(text("""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name = 'samples' 
                AND column_name = 'rejectionHistory'
            """))
            
            if result.fetchone():
                print("✓ Column 'rejectionHistory' already exists")
                return
            
            # Add the new column
            print("Adding 'rejectionHistory' column...")
            conn.execute(text("""
                ALTER TABLE samples 
                ADD COLUMN "rejectionHistory" JSONB DEFAULT '[]'::jsonb
            """))
            
            conn.commit()
            print("✓ Successfully added 'rejectionHistory' column")
            
        except Exception as e:
            conn.rollback()
            print(f"✗ Error during migration: {e}")
            raise


if __name__ == "__main__":
    migrate()

