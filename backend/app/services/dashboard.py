"""Dashboard aggregate metrics."""
from datetime import UTC, datetime

from app.models.billing import Payment
from app.models.order import Order, OrderTest
from app.models.patient import Patient
from app.schemas.dashboard import DashboardSummaryResponse
from app.schemas.enums import OrderStatus
from app.services.orders import _order_to_summary
from sqlalchemy import func
from sqlalchemy.orm import Session, joinedload


class DashboardService:
    def __init__(self, db: Session):
        self.db = db

    def get_summary(self) -> DashboardSummaryResponse:
        today = datetime.now(UTC).date()
        today_start = datetime.combine(today, datetime.min.time()).replace(tzinfo=UTC)

        total_patients = self.db.query(func.count(Patient.id)).scalar() or 0
        today_patients = (
            self.db.query(func.count(Patient.id))
            .filter(Patient.registrationDate >= today_start)
            .scalar()
            or 0
        )

        total_orders = self.db.query(func.count(Order.orderId)).scalar() or 0
        today_orders = (
            self.db.query(func.count(Order.orderId))
            .filter(Order.orderDate >= today_start)
            .scalar()
            or 0
        )

        today_revenue = (
            self.db.query(func.coalesce(func.sum(Payment.amount), 0.0))
            .filter(Payment.paidAt >= today_start)
            .scalar()
            or 0.0
        )

        pending_orders = (
            self.db.query(func.count(Order.orderId))
            .filter(
                Order.overallStatus.in_([OrderStatus.ORDERED, OrderStatus.IN_PROGRESS]),
            )
            .scalar()
            or 0
        )

        recent = (
            self.db.query(Order)
            .options(joinedload(Order.patient))
            .order_by(Order.orderDate.desc())
            .limit(5)
            .all()
        )
        recent_ids = [order.orderId for order in recent]
        test_counts: dict[int, int] = {}
        if recent_ids:
            rows = (
                self.db.query(OrderTest.orderId, func.count(OrderTest.id))
                .filter(OrderTest.orderId.in_(recent_ids))
                .group_by(OrderTest.orderId)
                .all()
            )
            test_counts = {order_id: count for order_id, count in rows}

        recent_orders = [
            _order_to_summary(order, test_counts.get(order.orderId, 0)) for order in recent
        ]

        return DashboardSummaryResponse(
            totalPatients=total_patients,
            todayPatients=today_patients,
            totalOrders=total_orders,
            todayOrders=today_orders,
            todayRevenue=float(today_revenue),
            pendingOrders=pending_orders,
            recentOrders=recent_orders,
        )
