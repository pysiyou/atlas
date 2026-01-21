"""
Migrate order and test status values to new schema.

Order status changes:
- pending -> ordered
- sample-collection -> in-progress
- in-progress -> in-progress (unchanged)
- completed -> in-progress (tests resulted but not validated yet)
- validated -> completed
- reported -> completed
- rejected -> in-progress (rejection is test-level, order stays in progress)

Test status changes:
- completed -> resulted
"""
import sys
from pathlib import Path

# Add parent directory to path to import app modules
sys.path.insert(0, str(Path(__file__).parent.parent))

from sqlalchemy import text
from app.database import engine


# Mapping from old order status values to new ones
ORDER_STATUS_MIGRATION_MAP = {
    "pending": "ordered",
    "sample-collection": "in-progress",
    "in-progress": "in-progress",
    "completed": "in-progress",  # Tests resulted but not validated = still in progress
    "validated": "completed",
    "reported": "completed",
    "rejected": "in-progress",   # Rejection is test-level, order stays in progress
}

# Mapping from old test status values to new ones
TEST_STATUS_MIGRATION_MAP = {
    "completed": "resulted",  # Results entered, awaiting validation
}


def migrate_order_status():
    """
    Migrate existing order status values to the new simplified schema.
    """
    print("\n--- Order Status Migration ---")

    with engine.connect() as conn:
        try:
            # First, check current status distribution
            print("\nCurrent order status distribution:")
            result = conn.execute(text("""
                SELECT "overallStatus", COUNT(*) as count
                FROM orders
                GROUP BY "overallStatus"
                ORDER BY count DESC
            """))

            current_statuses = result.fetchall()
            for status, count in current_statuses:
                print(f"  {status}: {count} orders")

            if not current_statuses:
                print("  No orders found in database")
                return

            # Migrate each status
            print("\nMigrating order statuses...")
            total_migrated = 0

            for old_status, new_status in ORDER_STATUS_MIGRATION_MAP.items():
                if old_status == new_status:
                    continue  # Skip if status is unchanged

                result = conn.execute(
                    text('UPDATE orders SET "overallStatus" = :new_status WHERE "overallStatus" = :old_status'),
                    {"old_status": old_status, "new_status": new_status}
                )

                if result.rowcount > 0:
                    print(f"  ✓ Migrated {result.rowcount} orders: {old_status} -> {new_status}")
                    total_migrated += result.rowcount

            conn.commit()

            # Verify final distribution
            print("\nFinal order status distribution:")
            result = conn.execute(text("""
                SELECT "overallStatus", COUNT(*) as count
                FROM orders
                GROUP BY "overallStatus"
                ORDER BY count DESC
            """))

            final_statuses = result.fetchall()
            for status, count in final_statuses:
                print(f"  {status}: {count} orders")

            print(f"\n✓ Successfully migrated {total_migrated} orders")

        except Exception as e:
            conn.rollback()
            print(f"✗ Error during migration: {e}")
            raise


def migrate_test_status():
    """
    Migrate existing test status values (completed -> resulted).
    """
    print("\n--- Test Status Migration ---")

    with engine.connect() as conn:
        try:
            # First, check current status distribution
            print("\nCurrent test status distribution:")
            result = conn.execute(text("""
                SELECT status, COUNT(*) as count
                FROM order_tests
                GROUP BY status
                ORDER BY count DESC
            """))

            current_statuses = result.fetchall()
            for status, count in current_statuses:
                print(f"  {status}: {count} tests")

            if not current_statuses:
                print("  No tests found in database")
                return

            # Migrate each status
            print("\nMigrating test statuses...")
            total_migrated = 0

            for old_status, new_status in TEST_STATUS_MIGRATION_MAP.items():
                result = conn.execute(
                    text('UPDATE order_tests SET status = :new_status WHERE status = :old_status'),
                    {"old_status": old_status, "new_status": new_status}
                )

                if result.rowcount > 0:
                    print(f"  ✓ Migrated {result.rowcount} tests: {old_status} -> {new_status}")
                    total_migrated += result.rowcount

            conn.commit()

            # Verify final distribution
            print("\nFinal test status distribution:")
            result = conn.execute(text("""
                SELECT status, COUNT(*) as count
                FROM order_tests
                GROUP BY status
                ORDER BY count DESC
            """))

            final_statuses = result.fetchall()
            for status, count in final_statuses:
                print(f"  {status}: {count} tests")

            print(f"\n✓ Successfully migrated {total_migrated} tests")

        except Exception as e:
            conn.rollback()
            print(f"✗ Error during migration: {e}")
            raise


if __name__ == "__main__":
    print("=" * 60)
    print("Order & Test Status Migration")
    print("=" * 60)
    print()
    print(f"Connecting to database: {engine.url}")
    print()
    print("This script migrates statuses to the new schema:")
    print()
    print("Order statuses:")
    print("  - pending -> ordered")
    print("  - sample-collection -> in-progress")
    print("  - completed -> in-progress (needs validation)")
    print("  - validated -> completed")
    print("  - reported -> completed")
    print("  - rejected -> in-progress (rejection is test-level)")
    print()
    print("Test statuses:")
    print("  - completed -> resulted")
    print()

    migrate_order_status()
    migrate_test_status()

    print()
    print("=" * 60)
    print("Migration Complete!")
    print("=" * 60)
