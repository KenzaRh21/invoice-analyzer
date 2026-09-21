from typing import List, Dict, Optional, Any
from pydantic import BaseModel

class MonthlyVolume(BaseModel):
    month: str
    count: int

class MonthlyAmount(BaseModel):
    month: str
    amount: float

class StatusDistribution(BaseModel):
    status: str
    count: int

class CurrencySummary(BaseModel):
    currency: str
    total_amount: float
    unpaid_amount: float
    overdue_amount: float
    count: int

class DashboardStatsOut(BaseModel):
    total_invoices: int
    processed_invoices: int
    pending_invoices: int
    failed_invoices: int
    total_amount: float
    unpaid_amount: float
    overdue_amount: float
    currency: Optional[str] = None
    currency_summaries: List[CurrencySummary] = []
    monthly_volume: List[MonthlyVolume]
    monthly_amount: List[MonthlyAmount]
    payment_distribution: List[StatusDistribution]
