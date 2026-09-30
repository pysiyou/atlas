"""Dashboard aggregate API schemas."""
from app.domains.orders.schemas import OrderSummaryResponse
from pydantic import BaseModel


class DashboardSummaryResponse(BaseModel):
    totalPatients: int
    todayPatients: int
    totalOrders: int
    todayOrders: int
    todayRevenue: float
    pendingOrders: int
    recentOrders: list[OrderSummaryResponse]
