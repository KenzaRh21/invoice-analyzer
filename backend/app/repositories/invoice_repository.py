from typing import List, Optional, Tuple
from sqlalchemy import or_, desc, asc
from sqlalchemy.orm import Session
from app.models.invoice import Invoice
from app.models.invoice_item import InvoiceItem

class InvoiceRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, invoice_id: str, user_id: Optional[str] = None) -> Optional[Invoice]:
        query = self.db.query(Invoice).filter(Invoice.id == invoice_id)
        if user_id:
            query = query.filter(Invoice.user_id == user_id)
        return query.first()

    def find_duplicate(
        self,
        user_id: str,
        invoice_number: str,
        supplier_name: Optional[str] = None,
        exclude_id: Optional[str] = None
    ) -> Optional[Invoice]:
        if not invoice_number or not invoice_number.strip():
            return None
        query = self.db.query(Invoice).filter(
            Invoice.user_id == user_id,
            Invoice.invoice_number == invoice_number.strip()
        )
        if supplier_name and supplier_name.strip():
            query = query.filter(Invoice.supplier_name.ilike(supplier_name.strip()))
        if exclude_id:
            query = query.filter(Invoice.id != exclude_id)
        return query.first()

    def list_invoices(
        self,
        user_id: str,
        search: Optional[str] = None,
        status: Optional[str] = None,
        payment_status: Optional[str] = None,
        sort_by: str = "created_at",
        sort_order: str = "desc",
        skip: int = 0,
        limit: int = 20
    ) -> Tuple[List[Invoice], int]:
        query = self.db.query(Invoice).filter(Invoice.user_id == user_id)

        if search and search.strip():
            term = f"%{search.strip()}%"
            query = query.filter(
                or_(
                    Invoice.invoice_number.ilike(term),
                    Invoice.supplier_name.ilike(term),
                    Invoice.customer_name.ilike(term),
                    Invoice.file_name.ilike(term)
                )
            )

        if status and status.upper() != "ALL":
            query = query.filter(Invoice.status == status.upper())

        if payment_status and payment_status.upper() != "ALL":
            query = query.filter(Invoice.payment_status == payment_status.upper())

        total = query.count()

        # Sorting
        order_col = getattr(Invoice, sort_by, Invoice.created_at)
        if sort_order.lower() == "asc":
            query = query.order_by(asc(order_col))
        else:
            query = query.order_by(desc(order_col))

        invoices = query.offset(skip).limit(limit).all()
        return invoices, total

    def create(self, invoice: Invoice) -> Invoice:
        self.db.add(invoice)
        self.db.commit()
        self.db.refresh(invoice)
        return invoice

    def update(self, invoice: Invoice) -> Invoice:
        self.db.commit()
        self.db.refresh(invoice)
        return invoice

    def delete(self, invoice: Invoice) -> None:
        self.db.delete(invoice)
        self.db.commit()

    def replace_items(self, invoice: Invoice, items_data: list) -> None:
        # Delete existing items
        self.db.query(InvoiceItem).filter(InvoiceItem.invoice_id == invoice.id).delete()
        for it in items_data:
            new_item = InvoiceItem(
                invoice_id=invoice.id,
                description=it.description,
                quantity=it.quantity,
                unit_price=it.unit_price,
                tax_rate=it.tax_rate,
                total=it.total
            )
            self.db.add(new_item)
        self.db.commit()
        self.db.refresh(invoice)
