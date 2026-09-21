from datetime import datetime
from typing import List, Optional, Any, Dict
from pydantic import BaseModel, Field

class InvoiceItemBase(BaseModel):
    description: str
    quantity: float = 1.0
    unit_price: float = 0.0
    tax_rate: float = 0.0
    total: float = 0.0

class InvoiceItemCreate(InvoiceItemBase):
    pass

class InvoiceItemOut(InvoiceItemBase):
    id: str
    invoice_id: str

    class Config:
        from_attributes = True

class InvoiceBase(BaseModel):
    invoice_number: Optional[str] = None
    invoice_date: Optional[str] = None
    due_date: Optional[str] = None
    supplier_name: Optional[str] = None
    supplier_tax_id: Optional[str] = None
    supplier_address: Optional[str] = None
    customer_name: Optional[str] = None
    customer_tax_id: Optional[str] = None
    currency: Optional[str] = None  # None / null if unknown. Never default to MAD!
    subtotal: Optional[float] = 0.0
    tax_amount: Optional[float] = 0.0
    total_amount: Optional[float] = 0.0
    payment_status: Optional[str] = "UNPAID"

class InvoiceUpdate(InvoiceBase):
    items: Optional[List[InvoiceItemBase]] = None
    requires_review: Optional[bool] = None
    review_notes: Optional[str] = None

class InvoiceOut(InvoiceBase):
    id: str
    user_id: str
    file_name: str
    status: str
    confidence_score: Optional[float] = 0.0
    processing_time_ms: Optional[int] = 0
    provider_used: Optional[str] = "mock"
    is_duplicate: Optional[bool] = False
    duplicate_of_id: Optional[str] = None
    requires_review: Optional[bool] = False
    review_notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class InvoiceDetailOut(InvoiceOut):
    file_path: str
    raw_text: Optional[str] = None
    error_message: Optional[str] = None
    items: List[InvoiceItemOut] = []
    confidence_breakdown: Optional[Dict[str, Any]] = None

    class Config:
        from_attributes = True

class InvoiceListResponse(BaseModel):
    items: List[InvoiceOut]
    total: int
    page: int
    limit: int
    pages: int
