from collections import defaultdict
from datetime import datetime
from typing import Dict
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.invoice import Invoice
from app.schemas.dashboard import DashboardStatsOut, MonthlyVolume, MonthlyAmount, StatusDistribution, CurrencySummary

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

@router.get("/stats", response_model=DashboardStatsOut)
def get_dashboard_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Retrieve aggregate KPI stats, multi-currency breakdowns, and chart series for the dashboard."""
    invoices = db.query(Invoice).filter(Invoice.user_id == current_user.id).all()

    total_invoices = len(invoices)
    processed_invoices = sum(1 for i in invoices if i.status == "PROCESSED")
    pending_invoices = sum(1 for i in invoices if i.status in ["UPLOADED", "PROCESSING"])
    failed_invoices = sum(1 for i in invoices if i.status == "FAILED")

    # Multi-currency aggregations
    curr_map: Dict[str, Dict[str, float]] = defaultdict(lambda: {
        "total": 0.0, "unpaid": 0.0, "overdue": 0.0, "count": 0
    })

    total_amount = 0.0
    unpaid_amount = 0.0
    overdue_amount = 0.0

    # Monthly aggregation
    monthly_counts = defaultdict(int)
    monthly_sums = defaultdict(float)
    status_counts = defaultdict(int)

    for i in invoices:
        status_counts[i.payment_status or "UNKNOWN"] += 1
        curr = i.currency or "UNKNOWN"

        if i.status == "PROCESSED":
            tot = i.total_amount or 0.0
            total_amount += tot
            curr_map[curr]["total"] += tot
            curr_map[curr]["count"] += 1

            if i.payment_status == "UNPAID":
                unpaid_amount += tot
                curr_map[curr]["unpaid"] += tot
            elif i.payment_status == "OVERDUE":
                overdue_amount += tot
                curr_map[curr]["overdue"] += tot

        # Month from invoice_date or created_at
        month_str = "Unknown"
        if i.invoice_date and len(i.invoice_date) >= 7:
            try:
                dt = datetime.strptime(i.invoice_date[:7], "%Y-%m")
                month_str = dt.strftime("%b %Y")
            except Exception:
                month_str = i.created_at.strftime("%b %Y")
        else:
            month_str = i.created_at.strftime("%b %Y")

        monthly_counts[month_str] += 1
        if i.status == "PROCESSED":
            monthly_sums[month_str] += (i.total_amount or 0.0)

    # Provide sorted months
    month_vol_list = [MonthlyVolume(month=k, count=v) for k, v in monthly_counts.items()]
    month_amt_list = [MonthlyAmount(month=k, amount=round(v, 2)) for k, v in monthly_sums.items()]
    payment_dist_list = [StatusDistribution(status=k, count=v) for k, v in status_counts.items()]

    currency_summaries = [
        CurrencySummary(
            currency=k,
            total_amount=round(v["total"], 2),
            unpaid_amount=round(v["unpaid"], 2),
            overdue_amount=round(v["overdue"], 2),
            count=int(v["count"])
        )
        for k, v in curr_map.items()
    ]

    # Determine primary currency (most frequent, or first, or None)
    primary_curr = None
    if currency_summaries:
        # Sort by count desc
        sorted_currs = sorted(currency_summaries, key=lambda x: x.count, reverse=True)
        primary_curr = sorted_currs[0].currency if sorted_currs[0].currency != "UNKNOWN" else (
            sorted_currs[1].currency if len(sorted_currs) > 1 else None
        )

    return DashboardStatsOut(
        total_invoices=total_invoices,
        processed_invoices=processed_invoices,
        pending_invoices=pending_invoices,
        failed_invoices=failed_invoices,
        total_amount=round(total_amount, 2),
        unpaid_amount=round(unpaid_amount, 2),
        overdue_amount=round(overdue_amount, 2),
        currency=primary_curr,
        currency_summaries=currency_summaries,
        monthly_volume=month_vol_list,
        monthly_amount=month_amt_list,
        payment_distribution=payment_dist_list
    )
