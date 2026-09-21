from app.core.currency import normalize_currency, parse_localized_amount, validate_financial_math
from app.schemas.extraction import InvoiceExtraction, Supplier, Customer
from app.services.confidence_service import ConfidenceService

def test_currency_normalization_symbols_and_codes():
    # Never convert "$" or "USD" to MAD
    assert normalize_currency("$") == "USD"
    assert normalize_currency("US$") == "USD"
    assert normalize_currency("USD") == "USD"
    assert normalize_currency("US Dollar") == "USD"
    assert normalize_currency("US Dollars") == "USD"

    # Euros
    assert normalize_currency("€") == "EUR"
    assert normalize_currency("EUR") == "EUR"
    assert normalize_currency("Euro") == "EUR"
    assert normalize_currency("Euros") == "EUR"

    # British Pound
    assert normalize_currency("£") == "GBP"
    assert normalize_currency("GBP") == "GBP"
    assert normalize_currency("Pound Sterling") == "GBP"

    # Canadian and Australian Dollars
    assert normalize_currency("CAD") == "CAD"
    assert normalize_currency("C$") == "CAD"
    assert normalize_currency("AUD") == "AUD"
    assert normalize_currency("A$") == "AUD"

    # Swiss Franc
    assert normalize_currency("CHF") == "CHF"
    assert normalize_currency("Swiss Franc") == "CHF"

    # Middle East Currencies
    assert normalize_currency("AED") == "AED"
    assert normalize_currency("SAR") == "SAR"
    assert normalize_currency("QAR") == "QAR"
    assert normalize_currency("KWD") == "KWD"

    # Asian Currencies
    assert normalize_currency("JPY") == "JPY"
    assert normalize_currency("CNY") == "CNY"
    assert normalize_currency("INR") == "INR"

    # Moroccan Dirham with appropriate context or exact symbols
    assert normalize_currency("MAD") == "MAD"
    assert normalize_currency("Moroccan Dirham") == "MAD"
    assert normalize_currency("DH", "Societe Casablanca Maroc ICE 1234") == "MAD"
    assert normalize_currency("د.م.", "Rabat Maroc") == "MAD"

    # Unknown when cannot be determined (NEVER default to MAD!)
    assert normalize_currency(None) is None
    assert normalize_currency("") is None
    assert normalize_currency("UNKNOWN") is None
    assert normalize_currency("XYZ_UNKNOWN_SYMBOL") is None

def test_international_number_parsing():
    # US / UK style: comma thousand, dot decimal
    assert parse_localized_amount("1,250.50") == 1250.50
    assert parse_localized_amount("$1,250.50") == 1250.50
    assert parse_localized_amount("USD 1,250.50") == 1250.50

    # European style: dot thousand, comma decimal
    assert parse_localized_amount("1.250,50") == 1250.50
    assert parse_localized_amount("1.250,50 €") == 1250.50
    assert parse_localized_amount("€1 250,50") == 1250.50

    # French / Moroccan style: space thousand, comma decimal
    assert parse_localized_amount("1 250,50") == 1250.50
    assert parse_localized_amount("10 000,00 MAD") == 10000.00
    assert parse_localized_amount("10.000,00 DH") == 10000.00
    assert parse_localized_amount("10 000") == 10000.00

def test_financial_math_validation_in_own_currency():
    # Correct USD math: 1000 subtotal + 200 tax = 1200 total
    valid, err = validate_financial_math(subtotal=1000.0, tax=200.0, total=1200.0)
    assert valid is True
    assert err is None

    # Mismatch USD math: 1000 subtotal + 200 tax = 1200, but total is 1500
    valid, err = validate_financial_math(subtotal=1000.0, tax=200.0, total=1500.0)
    assert valid is False
    assert "Arithmetic mismatch" in err

def test_confidence_and_review_with_unknown_currency():
    # Extraction with unknown currency should be flagged for review
    inv_no_curr = InvoiceExtraction(
        invoice_number="INV-2026-999",
        invoice_date="2026-09-15",
        due_date="2026-10-15",
        supplier=Supplier(name="Mystery Vendor"),
        customer=Customer(name="Acme Corp"),
        currency=None,  # Unknown!
        subtotal=100.0,
        tax=20.0,
        total=120.0
    )
    score, breakdown = ConfidenceService.calculate_confidence(inv_no_curr)
    assert breakdown["requires_review"] is True
    assert any("Currency" in reason for reason in breakdown["review_reasons"])
