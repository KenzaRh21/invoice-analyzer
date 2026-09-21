import os
import uuid
import time
import csv
import io
import json
from datetime import datetime, timezone
from typing import Optional, List, Tuple
from fastapi import HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.logging import logger
from app.models.invoice import Invoice
from app.models.invoice_item import InvoiceItem
from app.repositories.invoice_repository import InvoiceRepository
from app.providers.ocr_provider import get_ocr_provider
from app.providers.extraction_provider import get_extraction_provider
from app.services.confidence_service import ConfidenceService
from app.schemas.invoice import InvoiceUpdate, InvoiceListResponse, InvoiceOut, InvoiceDetailOut

class InvoiceService:
    def __init__(self, db: Session):
        self.db = db
        self.repo = InvoiceRepository(db)
        self.ocr_provider = get_ocr_provider()
        self.ai_provider = get_extraction_provider()

    async def upload_and_process(self, file: UploadFile, user_id: str) -> InvoiceDetailOut:
        # 1. Validate extension
        filename = file.filename or "invoice.pdf"
        ext = os.path.splitext(filename)[1].lower()
        if ext not in settings.ALLOWED_EXTENSIONS:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Unsupported file format '{ext}'. Allowed: {', '.join(settings.ALLOWED_EXTENSIONS)}"
            )

        # 2. Validate MIME type
        content_type = file.content_type or ""
        if content_type and content_type not in settings.ALLOWED_MIME_TYPES:
            # Tolerant check for generic octet-stream with correct extension
            if content_type != "application/octet-stream":
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Invalid MIME type '{content_type}'."
                )

        # Read file into memory and check size
        content = await file.read()
        max_bytes = settings.MAX_FILE_SIZE_MB * 1024 * 1024
        if len(content) > max_bytes:
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail=f"File exceeds maximum allowed size of {settings.MAX_FILE_SIZE_MB}MB."
            )

        # 3. Store file safely
        os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
        clean_name = filename.replace("/", "_").replace("\\", "_")
        safe_filename = f"{uuid.uuid4().hex}_{clean_name}"
        stored_path = os.path.join(settings.UPLOAD_DIR, safe_filename)
        with open(stored_path, "wb") as f:
            f.write(content)

        logger.info(f"invoice uploaded: {filename} stored at {stored_path}")

        # 4. Create Initial Invoice Record
        invoice = Invoice(
            user_id=user_id,
            file_name=filename,
            file_path=stored_path,
            status="PROCESSING"
        )
        invoice = self.repo.create(invoice)
        start_time = time.time()

        # 5. Process Pipeline
        try:
            logger.info("processing started")
            # Step A: OCR / text extraction
            raw_text = await self.ocr_provider.extract_text(stored_path)
            logger.info("OCR completed")

            # Step B: AI extraction
            extraction = await self.ai_provider.extract_invoice(raw_text, stored_path)
            logger.info("AI extraction completed")

            # Step C: Confidence score
            confidence, _ = ConfidenceService.calculate_confidence(extraction)
            logger.info(f"validation completed. Confidence: {confidence}%")

            duration_ms = int((time.time() - start_time) * 1000)

            # Step D: Update invoice record
            invoice.status = "PROCESSED"
            invoice.invoice_number = extraction.invoice_number
            invoice.invoice_date = extraction.invoice_date
            invoice.due_date = extraction.due_date
            invoice.supplier_name = extraction.supplier.name if extraction.supplier else None
            invoice.supplier_tax_id = extraction.supplier.tax_id if extraction.supplier else None
            invoice.supplier_address = extraction.supplier.address if extraction.supplier else None
            invoice.customer_name = extraction.customer.name if extraction.customer else None
            invoice.customer_tax_id = extraction.customer.tax_id if extraction.customer else None
            invoice.currency = extraction.currency or "MAD"
            invoice.subtotal = extraction.subtotal or 0.0
            invoice.tax_amount = extraction.tax or 0.0
            invoice.total_amount = extraction.total or 0.0
            invoice.payment_status = (extraction.payment_status or "UNPAID").upper()
            invoice.raw_text = raw_text
            invoice.confidence_score = confidence
            invoice.processing_time_ms = duration_ms
            invoice.provider_used = settings.AI_PROVIDER
            invoice.error_message = None

            self.repo.update(invoice)

            # Step E: Store items
            if extraction.items:
                self.repo.replace_items(invoice, extraction.items)

            return InvoiceDetailOut.model_validate(invoice)

        except Exception as e:
            logger.error(f"processing failed: {e}")
            duration_ms = int((time.time() - start_time) * 1000)
            invoice.status = "FAILED"
            invoice.error_message = str(e)
            invoice.processing_time_ms = duration_ms
            self.repo.update(invoice)
            return InvoiceDetailOut.model_validate(invoice)

    def get_invoice(self, invoice_id: str, user_id: str) -> InvoiceDetailOut:
        invoice = self.repo.get_by_id(invoice_id, user_id)
        if not invoice:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Invoice not found.")
        return InvoiceDetailOut.model_validate(invoice)

    def list_invoices(
        self,
        user_id: str,
        search: Optional[str] = None,
        status: Optional[str] = None,
        payment_status: Optional[str] = None,
        sort_by: str = "created_at",
        sort_order: str = "desc",
        page: int = 1,
        limit: int = 20
    ) -> InvoiceListResponse:
        skip = (page - 1) * limit
        items, total = self.repo.list_invoices(
            user_id=user_id,
            search=search,
            status=status,
            payment_status=payment_status,
            sort_by=sort_by,
            sort_order=sort_order,
            skip=skip,
            limit=limit
        )
        pages = (total + limit - 1) // limit if limit > 0 else 1
        return InvoiceListResponse(
            items=[InvoiceOut.model_validate(i) for i in items],
            total=total,
            page=page,
            limit=limit,
            pages=pages
        )

    def update_invoice(self, invoice_id: str, user_id: str, payload: InvoiceUpdate) -> InvoiceDetailOut:
        invoice = self.repo.get_by_id(invoice_id, user_id)
        if not invoice:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Invoice not found.")

        # Human-in-the-loop manual correction
        if payload.invoice_number is not None:
            invoice.invoice_number = payload.invoice_number
        if payload.invoice_date is not None:
            invoice.invoice_date = payload.invoice_date
        if payload.due_date is not None:
            invoice.due_date = payload.due_date
        if payload.supplier_name is not None:
            invoice.supplier_name = payload.supplier_name
        if payload.supplier_tax_id is not None:
            invoice.supplier_tax_id = payload.supplier_tax_id
        if payload.supplier_address is not None:
            invoice.supplier_address = payload.supplier_address
        if payload.customer_name is not None:
            invoice.customer_name = payload.customer_name
        if payload.customer_tax_id is not None:
            invoice.customer_tax_id = payload.customer_tax_id
        if payload.currency is not None:
            invoice.currency = payload.currency
        if payload.subtotal is not None:
            invoice.subtotal = payload.subtotal
        if payload.tax_amount is not None:
            invoice.tax_amount = payload.tax_amount
        if payload.total_amount is not None:
            invoice.total_amount = payload.total_amount
        if payload.payment_status is not None:
            invoice.payment_status = payload.payment_status.upper()

        if payload.items is not None:
            self.repo.replace_items(invoice, payload.items)

        self.repo.update(invoice)
        logger.info(f"invoice manual correction applied for id {invoice.id}")
        return InvoiceDetailOut.model_validate(invoice)

    def delete_invoice(self, invoice_id: str, user_id: str) -> None:
        invoice = self.repo.get_by_id(invoice_id, user_id)
        if not invoice:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Invoice not found.")
        # Delete file if exists
        if invoice.file_path and os.path.exists(invoice.file_path):
            try:
                os.remove(invoice.file_path)
            except Exception:
                pass
        self.repo.delete(invoice)

    async def reprocess_invoice(self, invoice_id: str, user_id: str) -> InvoiceDetailOut:
        invoice = self.repo.get_by_id(invoice_id, user_id)
        if not invoice:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Invoice not found.")

        if not os.path.exists(invoice.file_path):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Original invoice file missing.")

        invoice.status = "PROCESSING"
        self.repo.update(invoice)

        start_time = time.time()
        try:
            raw_text = await self.ocr_provider.extract_text(invoice.file_path)
            extraction = await self.ai_provider.extract_invoice(raw_text, invoice.file_path)
            confidence, _ = ConfidenceService.calculate_confidence(extraction)
            duration_ms = int((time.time() - start_time) * 1000)

            invoice.status = "PROCESSED"
            invoice.invoice_number = extraction.invoice_number
            invoice.invoice_date = extraction.invoice_date
            invoice.due_date = extraction.due_date
            invoice.supplier_name = extraction.supplier.name if extraction.supplier else None
            invoice.supplier_tax_id = extraction.supplier.tax_id if extraction.supplier else None
            invoice.supplier_address = extraction.supplier.address if extraction.supplier else None
            invoice.customer_name = extraction.customer.name if extraction.customer else None
            invoice.customer_tax_id = extraction.customer.tax_id if extraction.customer else None
            invoice.currency = extraction.currency or "MAD"
            invoice.subtotal = extraction.subtotal or 0.0
            invoice.tax_amount = extraction.tax or 0.0
            invoice.total_amount = extraction.total or 0.0
            invoice.payment_status = (extraction.payment_status or "UNPAID").upper()
            invoice.raw_text = raw_text
            invoice.confidence_score = confidence
            invoice.processing_time_ms = duration_ms
            invoice.error_message = None

            self.repo.update(invoice)
            if extraction.items:
                self.repo.replace_items(invoice, extraction.items)

            return InvoiceDetailOut.model_validate(invoice)
        except Exception as e:
            invoice.status = "FAILED"
            invoice.error_message = str(e)
            self.repo.update(invoice)
            return InvoiceDetailOut.model_validate(invoice)

    def export_invoice(self, invoice_id: str, user_id: str, format: str = "json") -> Tuple[str, str, str]:
        invoice = self.get_invoice(invoice_id, user_id)
        if format.lower() == "csv":
            output = io.StringIO()
            writer = csv.writer(output)
            # CSV header as requested in Section 17
            writer.writerow([
                "invoice_number", "supplier", "invoice_date", "due_date",
                "currency", "subtotal", "tax", "total", "payment_status"
            ])
            writer.writerow([
                invoice.invoice_number or "",
                invoice.supplier_name or "",
                invoice.invoice_date or "",
                invoice.due_date or "",
                invoice.currency or "",
                invoice.subtotal or 0.0,
                invoice.tax_amount or 0.0,
                invoice.total_amount or 0.0,
                invoice.payment_status or ""
            ])
            content = output.getvalue()
            filename = f"invoice_{invoice.invoice_number or invoice.id}.csv"
            return content, "text/csv", filename
        else:
            data = invoice.model_dump(mode="json")
            content = json.dumps(data, indent=2, default=str)
            filename = f"invoice_{invoice.invoice_number or invoice.id}.json"
            return content, "application/json", filename
