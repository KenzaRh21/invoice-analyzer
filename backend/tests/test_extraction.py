from app.schemas.extraction import InvoiceExtraction, Supplier, Customer, InvoiceItemExtraction
from app.services.confidence_service import ConfidenceService

def test_invoice_extraction_pydantic_validation():
    data = {
        "invoice_number": "FAC-2026-00125",
        "invoice_date": "2026-09-18",
        "due_date": "2026-10-18",
        "supplier": {
            "name": "ABC SARL",
            "tax_id": "ICE123456789",
            "address": "Casablanca, Morocco"
        },
        "customer": {
            "name": "XYZ SARL",
            "tax_id": "ICE987654321"
        },
        "currency": "MAD",
        "subtotal": 10000.0,
        "tax": 2000.0,
        "total": 12000.0,
        "payment_status": "unpaid",
        "items": [
            {
                "description": "Software development",
                "quantity": 1.0,
                "unit_price": 10000.0,
                "tax_rate": 20.0,
                "total": 12000.0
            }
        ]
    }
    extracted = InvoiceExtraction(**data)
    assert extracted.invoice_number == "FAC-2026-00125"
    assert extracted.supplier.tax_id == "ICE123456789"
    assert len(extracted.items) == 1

def test_confidence_score_calculation():
    # Complete invoice -> High confidence (>=90%)
    complete_inv = InvoiceExtraction(
        invoice_number="FAC-2026-00125",
        invoice_date="2026-09-18",
        due_date="2026-10-18",
        supplier=Supplier(name="ABC SARL", tax_id="ICE123", address="Casablanca"),
        customer=Customer(name="XYZ SARL", tax_id="ICE987"),
        currency="MAD",
        subtotal=10000.0,
        tax=2000.0,
        total=12000.0,
        items=[InvoiceItemExtraction(description="Dev", quantity=1.0, unit_price=10000.0, tax_rate=20.0, total=12000.0)]
    )
    score, details = ConfidenceService.calculate_confidence(complete_inv)
    assert score >= 90.0
    assert details["level"] == "High"

    # Incomplete invoice -> Lower confidence
    sparse_inv = InvoiceExtraction(
        invoice_number=None,
        invoice_date=None,
        supplier=Supplier(name=None),
        total=0.0
    )
    score_sparse, details_sparse = ConfidenceService.calculate_confidence(sparse_inv)
    assert score_sparse < 50.0
    assert details_sparse["level"] == "Low"
