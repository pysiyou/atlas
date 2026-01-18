"""
Populate samples for existing orders that don't have samples

This script generates samples for all existing orders in the database.
It's a one-time fix for orders created before sample auto-generation was implemented.
"""
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models.order import Order
from app.models.sample import Sample
from app.services.sample_generator import generate_samples_for_order


def populate_samples():
    """Generate samples for all orders that don't have samples"""
    db = SessionLocal()
    try:
        print("🔍 Checking for orders without samples...")
        
        # Get all orders
        orders = db.query(Order).all()
        print(f"Found {len(orders)} total orders in database")
        
        if not orders:
            print("⚠️  No orders found. Run generate_orders.py first.")
            return
        
        samples_created = 0
        orders_processed = 0
        
        for order in orders:
            # Check if samples already exist for this order
            existing_samples = db.query(Sample).filter(
                Sample.orderId == order.orderId
            ).count()
            
            if existing_samples == 0:
                try:
                    # Generate samples for this order
                    samples = generate_samples_for_order(
                        order.orderId, 
                        db, 
                        order.createdBy
                    )
                    samples_created += len(samples)
                    orders_processed += 1
                    print(f"✓ {order.orderId}: Generated {len(samples)} sample(s)")
                except Exception as e:
                    print(f"✗ {order.orderId}: Error - {e}")
                    db.rollback()
                    # Continue with next order
                    continue
            else:
                print(f"⊘ {order.orderId}: Already has {existing_samples} sample(s)")
        
        print(f"\n{'='*60}")
        print(f"✅ Successfully processed {orders_processed} orders")
        print(f"✅ Created {samples_created} samples total")
        print(f"{'='*60}\n")
        
    except Exception as e:
        print(f"\n❌ Error populating samples: {e}")
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    populate_samples()
