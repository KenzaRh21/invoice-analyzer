import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Float, Integer, Text, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from app.core.database import Base

class Invoice(Base):
    __tablename__ = "invoices"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    file_name = Column(String(255), nullable=False)
    file_path = Column(String(512), nullable=False)
    status = Column(String(32), default="UPLOADED", nullable=False) # UPLOADED, PROCESSING, PROCESSED, FAILED

    invoice_number = Column(String(100), nullable=True, index=True)
    invoice_date = Column(String(50), nullable=True)
    due_date = Column(String(50), nullable=True)

    supplier_name = Column(String(255), nullable=True, index=True)
    supplier_tax_id = Column(String(100), nullable=True)
    supplier_address = Column(Text, nullable=True)

    customer_name = Column(String(255), nullable=True, index=True)
    customer_tax_id = Column(String(100), nullable=True)

    currency = Column(String(10), default=None, nullable=True) # Normalized ISO-4217, null if unknown. Never default to MAD!
    subtotal = Column(Float, default=0.0, nullable=True)
    tax_amount = Column(Float, default=0.0, nullable=True)
    total_amount = Column(Float, default=0.0, nullable=True)
    payment_status = Column(String(32), default="UNPAID", nullable=False) # UNKNOWN, PAID, UNPAID, OVERDUE

    raw_text = Column(Text, nullable=True)
    confidence_score = Column(Float, default=0.0, nullable=True) # 0 to 100
    processing_time_ms = Column(Integer, default=0, nullable=True)
    provider_used = Column(String(50), default="mock", nullable=True)
    error_message = Column(Text, nullable=True)

    is_duplicate = Column(Boolean, default=False, nullable=True)
    duplicate_of_id = Column(String(36), nullable=True)
    requires_review = Column(Boolean, default=False, nullable=True)
    review_notes = Column(Text, nullable=True)

    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    user = relationship("User", back_populates="invoices")
    items = relationship("InvoiceItem", back_populates="invoice", cascade="all, delete-orphan", order_by="InvoiceItem.id")
