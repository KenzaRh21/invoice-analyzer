from fastapi import APIRouter
from app.core.config import settings

router = APIRouter(tags=["Health"])

@router.get("/health")
def health_check():
    """Service health and provider configuration check."""
    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "providers": {
            "ocr": settings.OCR_PROVIDER,
            "ai": settings.AI_PROVIDER
        }
    }
