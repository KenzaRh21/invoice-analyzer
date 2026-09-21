from typing import List, Optional, Any
from pydantic import BaseModel, Field, field_validator
from app.core.currency import normalize_currency, parse_localized_amount

class Supplier(BaseModel):
    name: Optional[str] = Field(None, description="Supplier company name")
    tax_id: Optional[str] = Field(None, description="Supplier tax ID (e.g. ICE, IF, VAT, Tax ID, EIN)")
    address: Optional[str] = Field(None, description="Supplier full address")

class Customer(BaseModel):
    name: Optional[str] = Field(None, description="Customer company or individual name")
    tax_id: Optional[str] = Field(None, description="Customer tax ID (e.g. ICE, IF, VAT, Tax ID)")
    address: Optional[str] = Field(None, description="Customer address")

class InvoiceItemExtraction(BaseModel):
    description: str = Field(..., description="Line item description of good or service")
    quantity: float = Field(default=1.0, description="Quantity")
    unit_price: float = Field(default=0.0, description="Unit price before tax")
    tax_rate: Optional[float] = Field(default=0.0, description="Tax rate percentage (e.g. 20 for 20%)")
    total: float = Field(default=0.0, description="Total amount for this line item")

    @field_validator("quantity", "unit_price", "tax_rate", "total", mode="before")
    @classmethod
    def parse_numeric(cls, v: Any) -> float:
        parsed = parse_localized_amount(v)
        return parsed if parsed is not None else 0.0

class InvoiceExtraction(BaseModel):
    invoice_number: Optional[str] = Field(None, description="Unique invoice identifier")
    invoice_date: Optional[str] = Field(None, description="Date invoice was issued (YYYY-MM-DD)")
    due_date: Optional[str] = Field(None, description="Payment due date (YYYY-MM-DD)")
    supplier: Supplier = Field(default_factory=Supplier)
    customer: Customer = Field(default_factory=Customer)
    currency: Optional[str] = Field(default=None, description="ISO-4217 Currency code or null if unknown")
    subtotal: Optional[float] = Field(default=0.0, description="Subtotal amount before taxes")
    tax: Optional[float] = Field(default=0.0, description="Total tax amount")
    total: Optional[float] = Field(default=0.0, description="Final grand total amount")
    payment_status: Optional[str] = Field(default="unpaid", description="Status: paid, unpaid, overdue, unknown")
    items: List[InvoiceItemExtraction] = Field(default_factory=list, description="List of line items")

    @field_validator("currency", mode="before")
    @classmethod
    def normalize_curr(cls, v: Any) -> Optional[str]:
        if not v:
            return None
        norm = normalize_currency(str(v))
        return norm

    @field_validator("subtotal", "tax", "total", mode="before")
    @classmethod
    def parse_totals(cls, v: Any) -> Optional[float]:
        parsed = parse_localized_amount(v)
        return parsed if parsed is not None else 0.0
