"""Dashboard aggregate API schemas."""
from pydantic import BaseModel

from app.schemas.order import OrderSummaryResponse


class DashboardSummaryResponse(BaseModel):
    totalPatients: int
    todayPatients: int
    totalOrders: int
    todayOrders: int
    todayRevenue: float
    pendingOrders: int
    recentOrders: list[OrderSummaryResponse]
