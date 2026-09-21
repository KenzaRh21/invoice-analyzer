from typing import Dict, Any, Tuple, List
from app.schemas.extraction import InvoiceExtraction
from app.core.currency import validate_financial_math

class ConfidenceService:
    @staticmethod
    def calculate_confidence(extraction: InvoiceExtraction) -> Tuple[float, Dict[str, Any]]:
        """
        Calculates extraction quality score (0 to 100) based on weighted field presence,
        dynamic currency identification, and currency-aware arithmetic consistency:
        - invoice_number: 20 pts
        - invoice_date: 15 pts
        - supplier_name: 20 pts
        - total_amount: 20 pts
        - currency detected (ISO 4217): 10 pts
        - customer_name: 5 pts
        - math consistency (subtotal + tax == total in invoice currency): 10 pts
        """
        score = 0.0
        breakdown: Dict[str, Any] = {}
        review_reasons: List[str] = []

        # 1. Invoice Number (20%)
        if extraction.invoice_number and len(extraction.invoice_number.strip()) >= 2:
            score += 20.0
            breakdown["invoice_number"] = {"valid": True, "score": 20, "value": extraction.invoice_number}
        else:
            breakdown["invoice_number"] = {"valid": False, "score": 0, "message": "Invoice number missing or invalid"}
            review_reasons.append("Invoice number could not be extracted")

        # 2. Invoice Date (15%)
        if extraction.invoice_date and len(extraction.invoice_date.strip()) >= 8:
            score += 15.0
            breakdown["invoice_date"] = {"valid": True, "score": 15, "value": extraction.invoice_date}
        else:
            breakdown["invoice_date"] = {"valid": False, "score": 0, "message": "Invoice date missing"}
            review_reasons.append("Invoice date missing")

        # 3. Supplier Name (20%)
        if extraction.supplier and extraction.supplier.name and len(extraction.supplier.name.strip()) >= 2:
            score += 20.0
            breakdown["supplier_name"] = {"valid": True, "score": 20, "value": extraction.supplier.name}
        else:
            breakdown["supplier_name"] = {"valid": False, "score": 0, "message": "Supplier name missing"}
            review_reasons.append("Supplier name missing")

        # 4. Total Amount (20%)
        if extraction.total is not None and extraction.total > 0:
            score += 20.0
            breakdown["total_amount"] = {"valid": True, "score": 20, "value": extraction.total}
        else:
            breakdown["total_amount"] = {"valid": False, "score": 0, "message": "Total amount missing or zero"}
            review_reasons.append("Total amount missing or invalid")

        # 5. Currency (10%) - Currency must be detected, never assumed
        if extraction.currency and len(extraction.currency.strip()) >= 2 and extraction.currency.upper() != "UNKNOWN":
            score += 10.0
            breakdown["currency"] = {"valid": True, "score": 10, "value": extraction.currency, "status": "detected"}
        else:
            breakdown["currency"] = {"valid": False, "score": 0, "value": None, "status": "unknown"}
            review_reasons.append("Currency could not be determined with certainty")

        # 6. Customer Name (5%)
        if extraction.customer and extraction.customer.name:
            score += 5.0
            breakdown["customer_name"] = {"valid": True, "score": 5, "value": extraction.customer.name}
        else:
            breakdown["customer_name"] = {"valid": False, "score": 0, "message": "Customer name optional but not found"}

        # 7. Currency-aware Math Consistency (10%)
        math_valid, math_err = validate_financial_math(
            subtotal=extraction.subtotal,
            tax=extraction.tax,
            total=extraction.total,
            tolerance=0.05
        )
        if math_valid:
            score += 10.0
            breakdown["math_consistency"] = {"valid": True, "score": 10, "message": "Arithmetic validated in invoice currency"}
        else:
            breakdown["math_consistency"] = {"valid": False, "score": 0, "message": math_err or "Math mismatch"}
            if extraction.total and extraction.total > 0 and (extraction.subtotal or extraction.tax):
                review_reasons.append(f"Financial math mismatch in {extraction.currency or 'unspecified currency'}")

        confidence = round(min(score, 100.0), 1)

        level = "Low"
        if confidence >= 85.0:
            level = "High"
        elif confidence >= 65.0:
            level = "Medium"

        requires_review = confidence < 75.0 or len(review_reasons) > 0

        return confidence, {
            "score": confidence,
            "level": level,
            "requires_review": requires_review,
            "review_reasons": review_reasons,
            "breakdown": breakdown,
            "currency_detected": extraction.currency is not None and extraction.currency != "UNKNOWN",
            "disclaimer": "Automated confidence score based on field completeness, currency detection, and currency-aware arithmetic consistency."
        }
