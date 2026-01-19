"""
Generate payments for orders
"""
import random
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from app.models.billing import Payment
from app.models.order import Order
from app.schemas.enums import PaymentStatus, PaymentMethod
from app.services.id_generator import generate_id


def generate_payments_for_order(order: Order, db: Session) -> list[Payment]:
    """
    Generate payments for an order based on its payment status
    
    Args:
        order: The order to generate payments for
        db: Database session
        
    Returns:
        List of created Payment objects
    """
    payments = []
    
    # Randomly decide payment status distribution:
    # 70% fully paid, 30% unpaid (no payment)
    payment_scenario = random.choices(
        ['paid', 'unpaid'],
        weights=[70, 30],
        k=1
    )[0]
    
    if payment_scenario == 'unpaid':
        # No payment generated, order stays unpaid
        order.paymentStatus = PaymentStatus.UNPAID
        return payments
    
    # Determine payment method
    payment_method = random.choice([
        PaymentMethod.CASH,
        PaymentMethod.CREDIT_CARD,
        PaymentMethod.DEBIT_CARD,
        PaymentMethod.INSURANCE,
        PaymentMethod.BANK_TRANSFER,
        PaymentMethod.MOBILE_MONEY,
    ])
    
    # Single full payment
    payment_date = order.orderDate + timedelta(
        hours=random.randint(1, 48)
    )
    
    payment = Payment(
        paymentId=generate_id("payment", db),
        orderId=order.orderId,
        invoiceId=None,  # Can be linked later if invoices are generated
        amount=order.totalPrice,
        paymentMethod=payment_method,
        paidAt=payment_date,
        receivedBy="system",
        receiptGenerated=True,
        notes=f"Full payment via {payment_method.value}"
    )
    
    db.add(payment)
    db.flush()  # Flush to make ID visible for next iteration
    payments.append(payment)
    order.paymentStatus = PaymentStatus.PAID
    
    return payments


def generate_payments(db: Session):
    """
    Generate payments for all existing orders
    """
    print("💳 Generating payments for orders...")
    
    orders = db.query(Order).all()
    if not orders:
        print("❌ No orders found in database. Cannot generate payments.")
        return
    
    total_payments = 0
    paid_orders = 0
    unpaid_orders = 0
    
    try:
        for order in orders:
            payments = generate_payments_for_order(order, db)
            total_payments += len(payments)
            
            if order.paymentStatus == PaymentStatus.PAID:
                paid_orders += 1
            else:
                unpaid_orders += 1
            
            if payments:
                payment_summary = f"{len(payments)} payment(s), ${sum(p.amount for p in payments):.2f}"
                print(f"  ✓ {order.orderId}: {payment_summary} - {order.paymentStatus.value}")
        
        db.commit()
        print(f"\n{'='*60}")
        print(f"✅ Successfully created {total_payments} payments for {len(orders)} orders!")
        print(f"   📊 Payment Status Distribution:")
        print(f"      • Paid: {paid_orders} orders")
        print(f"      • Unpaid: {unpaid_orders} orders")
        print(f"{'='*60}\n")
        
    except Exception as e:
        print(f"\n❌ Error generating payments: {e}")
        db.rollback()
        raise
