from typing import Optional
from fastapi import APIRouter, Depends, UploadFile, File, Query, Response, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.schemas.invoice import InvoiceDetailOut, InvoiceListResponse, InvoiceUpdate
from app.services.invoice_service import InvoiceService

router = APIRouter(prefix="/invoices", tags=["Invoices"])

@router.post("/upload", response_model=InvoiceDetailOut, status_code=status.HTTP_201_CREATED)
async def upload_invoice(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Upload an invoice document (PDF, PNG, JPG, JPEG) and run automated OCR + multi-currency AI extraction."""
    service = InvoiceService(db)
    return await service.upload_and_process(file, current_user.id)

@router.get("", response_model=InvoiceListResponse)
def list_invoices(
    search: Optional[str] = Query(None, description="Search across invoice number, supplier, or customer"),
    status: Optional[str] = Query(None, description="Filter by status (UPLOADED, PROCESSING, PROCESSED, FAILED)"),
    payment_status: Optional[str] = Query(None, description="Filter by payment status (PAID, UNPAID, OVERDUE)"),
    sort_by: str = Query("created_at", description="Field to sort by"),
    sort_order: str = Query("desc", description="Sort direction (asc, desc)"),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """List invoices with backend pagination, search, sorting, and status filtering."""
    service = InvoiceService(db)
    return service.list_invoices(
        user_id=current_user.id,
        search=search,
        status=status,
        payment_status=payment_status,
        sort_by=sort_by,
        sort_order=sort_order,
        page=page,
        limit=limit
    )

@router.get("/{id}", response_model=InvoiceDetailOut)
def get_invoice(
    id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get full details of a specific invoice including items, confidence breakdown, and raw text."""
    service = InvoiceService(db)
    return service.get_invoice(id, current_user.id)

@router.get("/{id}/file")
def get_invoice_file(
    id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Serve the raw original invoice document (PDF, PNG, JPG) for preview/download."""
    service = InvoiceService(db)
    file_path, media_type, filename = service.get_invoice_file(id, current_user.id)
    return FileResponse(
        path=file_path,
        media_type=media_type,
        filename=filename
    )

@router.put("/{id}", response_model=InvoiceDetailOut)
def update_invoice(
    id: str,
    payload: InvoiceUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Human-in-the-loop manual correction of extracted invoice fields and line items."""
    service = InvoiceService(db)
    return service.update_invoice(id, current_user.id, payload)

@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_invoice(
    id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete an invoice and its associated physical file."""
    service = InvoiceService(db)
    service.delete_invoice(id, current_user.id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)

@router.post("/{id}/reprocess", response_model=InvoiceDetailOut)
async def reprocess_invoice(
    id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Re-run the OCR and AI extraction pipeline on an existing invoice document."""
    service = InvoiceService(db)
    return await service.reprocess_invoice(id, current_user.id)

@router.get("/{id}/export")
def export_invoice(
    id: str,
    format: str = Query("json", pattern="^(json|csv)$"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Export structured invoice data as CSV or JSON."""
    service = InvoiceService(db)
    content, media_type, filename = service.export_invoice(id, current_user.id, format)
    return Response(
        content=content,
        media_type=media_type,
        headers={"Content-Disposition": f'attachment; filename="{filename}"'}
    )
