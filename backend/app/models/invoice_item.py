import uuid
from sqlalchemy import Column, String, Float, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base

class InvoiceItem(Base):
    __tablename__ = "invoice_items"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    invoice_id = Column(String(36), ForeignKey("invoices.id", ondelete="CASCADE"), nullable=False, index=True)
    description = Column(String(500), nullable=False)
    quantity = Column(Float, default=1.0, nullable=False)
    unit_price = Column(Float, default=0.0, nullable=False)
    tax_rate = Column(Float, default=0.0, nullable=False) # e.g. 20 for 20%
    total = Column(Float, default=0.0, nullable=False)

    invoice = relationship("Invoice", back_populates="items")
