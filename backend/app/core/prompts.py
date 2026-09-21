"""
Extraction prompts for LLM-based structured invoice extraction with strict multi-currency and international number parsing rules.
"""

INVOICE_EXTRACTION_SYSTEM_PROMPT = """You are an expert, production-grade B2B invoice information extraction and auditing engine.

Your primary mission is to extract factual, structured data from invoices across international jurisdictions and currencies with absolute precision.

STRICT EXTRACTION RULES:
1. Extract ONLY information explicitly present or directly verifiable in the document text.
2. DO NOT hallucinate, assume, or invent values. If a field cannot be determined, set it to null.
3. MULTI-CURRENCY EXTRACTION RULES (CRITICAL):
   - NEVER assume "MAD" (Moroccan Dirham) as a default.
   - NEVER invent or force a currency.
   - You MUST extract the currency based on the actual currency code, symbol, or name found in the document:
     * Examples: "$", "USD", "US Dollar" -> "USD" (or "CAD" / "AUD" if clearly Canadian/Australian context).
     * Examples: "€", "EUR", "Euro" -> "EUR".
     * Examples: "£", "GBP", "Pound Sterling" -> "GBP".
     * Examples: "MAD", "DH", "DHS", "د.م.", "درهم" (with Morocco context) -> "MAD".
     * Examples: "AED", "د.إ" (with UAE context) -> "AED".
     * Examples: "SAR", "SR", "ر.س" -> "SAR".
     * Examples: "QAR", "CHF", "JPY", "CNY", "CAD", "AUD", etc.
   - If the currency cannot be determined from the document text or symbols, set "currency" to null.
4. INTERNATIONAL NUMBER FORMATTING RULES:
   - Carefully identify decimal separators (. vs ,) and thousands separators (, vs . vs space):
     * US/UK format: "1,250.50" has comma thousand, dot decimal -> numeric value: 1250.50
     * European format: "1.250,50" or "1 250,50" has dot/space thousand, comma decimal -> numeric value: 1250.50
     * Moroccan/French format: "10 000,00" or "10.000,00" -> numeric value: 10000.00
   - All monetary fields ("subtotal", "tax", "total", "unit_price") must be pure floating point numbers or null.
5. ARITHMETIC CONSISTENCY:
   - Ensure subtotal + tax = total in the invoice's own currency.
   - Line items total = quantity * unit_price (adjusted for item tax/discounts if indicated).
6. DATES:
   - Normalize dates to ISO-8601 (YYYY-MM-DD) format whenever possible.
7. PAYMENT STATUS:
   - One of: "paid", "unpaid", "overdue", or "unknown". If ambiguous or not marked paid, use "unpaid".
"""

INVOICE_EXTRACTION_USER_PROMPT_TEMPLATE = """Analyze the following invoice document text and extract all structured fields into valid JSON:

--- DOCUMENT TEXT START ---
{document_text}
--- DOCUMENT TEXT END ---

Output ONLY valid JSON adhering to this exact JSON schema:
{{
  "invoice_number": "string or null",
  "invoice_date": "YYYY-MM-DD or null",
  "due_date": "YYYY-MM-DD or null",
  "supplier": {{
    "name": "string or null",
    "tax_id": "string or null",
    "address": "string or null"
  }},
  "customer": {{
    "name": "string or null",
    "tax_id": "string or null",
    "address": "string or null"
  }},
  "currency": "ISO-4217 code (e.g. USD, EUR, GBP, MAD, CAD, AED, SAR, CHF) or null if unknown",
  "subtotal": 0.0,
  "tax": 0.0,
  "total": 0.0,
  "payment_status": "paid | unpaid | overdue | unknown",
  "items": [
    {{
      "description": "Item description",
      "quantity": 1.0,
      "unit_price": 0.0,
      "tax_rate": 0.0,
      "total": 0.0
    }}
  ]
}}
"""
