from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.logging import setup_logging, logger
from app.core.database import Base, engine, SessionLocal
from app.core.security import get_password_hash
from app.models.user import User
from app.models.invoice import Invoice
from app.models.invoice_item import InvoiceItem
from app.api import auth, invoices, dashboard, health

setup_logging()

# Auto-create tables for convenience in dev/test
Base.metadata.create_all(bind=engine)

def seed_initial_data():
    db = SessionLocal()
    try:
        # Check if demo user exists
        demo_user = db.query(User).filter(User.email == "demo@invoice.ma").first()
        if not demo_user:
            demo_user = User(
                email="demo@invoice.ma",
                password_hash=get_password_hash("Password123!"),
                full_name="Fatima Zahra Alami"
            )
            db.add(demo_user)
            db.commit()
            db.refresh(demo_user)
            logger.info("Created default demo user: demo@invoice.ma / Password123!")

        # Check if demo user has invoices
        inv_count = db.query(Invoice).filter(Invoice.user_id == demo_user.id).count()
        if inv_count == 0:
            # 1. USD Invoice
            inv_usd = Invoice(
                user_id=demo_user.id,
                file_name="invoice_us_saas_2026.pdf",
                file_path="uploads/demo_us.pdf",
                status="PROCESSED",
                invoice_number="INV-US-2026-990",
                invoice_date="2026-09-12",
                due_date="2026-10-12",
                supplier_name="GLOBAL SAAS TECHNOLOGIES INC.",
                supplier_tax_id="US-EIN-12-3456789",
                supplier_address="500 Howard Street, Suite 400, San Francisco, CA 94105, USA",
                customer_name="ENTERPRISE CLIENT LLC",
                customer_tax_id="US-EIN-98-7654321",
                currency="USD",
                subtotal=5000.0,
                tax_amount=450.0,
                total_amount=5450.0,
                payment_status="UNPAID",
                confidence_score=96.5,
                processing_time_ms=1420,
                provider_used="gemini-2.5-flash",
                raw_text="INVOICE\nInvoice Number: INV-US-2026-990\nDate: 2026-09-12\nDue Date: 2026-10-12\nSupplier: GLOBAL SAAS TECHNOLOGIES INC.\nSubtotal: $5,000.00\nTax (9%): $450.00\nTotal Due: $5,450.00 USD"
            )
            db.add(inv_usd)
            db.commit()
            db.refresh(inv_usd)

            item_usd = InvoiceItem(
                invoice_id=inv_usd.id,
                description="Enterprise AI Workflow Platform License (Annual)",
                quantity=1.0,
                unit_price=5000.0,
                tax_rate=9.0,
                total=5000.0
            )
            db.add(item_usd)

            # 2. EUR Invoice
            inv_eur = Invoice(
                user_id=demo_user.id,
                file_name="facture_cloud_europe_2026.pdf",
                file_path="uploads/demo_eur.pdf",
                status="PROCESSED",
                invoice_number="FR-2026-7812",
                invoice_date="2026-09-01",
                due_date="2026-10-01",
                supplier_name="EUROPE DIGITAL SOLUTIONS SAS",
                supplier_tax_id="FR82839201928",
                supplier_address="15 Rue de la Paix, 75002 Paris, France",
                customer_name="CONTINENTAL CORP BV",
                customer_tax_id="NL823749182B01",
                currency="EUR",
                subtotal=2500.0,
                tax_amount=500.0,
                total_amount=3000.0,
                payment_status="PAID",
                confidence_score=98.0,
                processing_time_ms=1180,
                provider_used="gemini-2.5-flash",
                raw_text="FACTURE\nNuméro: FR-2026-7812\nDate: 2026-09-01\nFournisseur: EUROPE DIGITAL SOLUTIONS SAS\nSous-total HT: 2.500,00 €\nTVA 20%: 500,00 €\nTotal TTC: 3.000,00 EUR"
            )
            db.add(inv_eur)
            db.commit()
            db.refresh(inv_eur)

            item_eur = InvoiceItem(
                invoice_id=inv_eur.id,
                description="Hébergement Cloud Haute Disponibilité & SLA",
                quantity=1.0,
                unit_price=2500.0,
                tax_rate=20.0,
                total=2500.0
            )
            db.add(item_eur)

            # 3. MAD Moroccan Invoice
            inv_mad = Invoice(
                user_id=demo_user.id,
                file_name="facture_atlas_cloud_maroc.pdf",
                file_path="uploads/demo_mad.pdf",
                status="PROCESSED",
                invoice_number="INV-2026-0482",
                invoice_date="2026-09-05",
                due_date="2026-10-05",
                supplier_name="ATLAS CLOUD & IT SERVICES SA",
                supplier_tax_id="002341567891234",
                supplier_address="Zone Franche Technopolis, Bâtiment B3, Rabat-Salé, Maroc",
                customer_name="MAROC DIGIT ENTERPRISE SARL",
                customer_tax_id="008765432198765",
                currency="MAD",
                subtotal=30000.0,
                tax_amount=6000.0,
                total_amount=36000.0,
                payment_status="PAID",
                confidence_score=94.0,
                processing_time_ms=1650,
                provider_used="gemini-2.5-flash",
                raw_text="FACTURE N° INV-2026-0482\nSociété: ATLAS CLOUD & IT SERVICES SA\nICE: 002341567891234\nMontant HT: 30 000,00 DH\nTVA 20%: 6 000,00 DH\nTotal TTC: 36 000,00 MAD"
            )
            db.add(inv_mad)
            db.commit()
            db.refresh(inv_mad)

            item_mad1 = InvoiceItem(
                invoice_id=inv_mad.id,
                description="Abonnement Cloud Infrastructure Dédiée (Mois Sept)",
                quantity=2.0,
                unit_price=4500.0,
                tax_rate=20.0,
                total=9000.0
            )
            item_mad2 = InvoiceItem(
                invoice_id=inv_mad.id,
                description="Audit de cybersécurité & Pentest applicatif",
                quantity=1.0,
                unit_price=15000.0,
                tax_rate=20.0,
                total=15000.0
            )
            db.add_all([item_mad1, item_mad2])
            db.commit()
            logger.info("Successfully seeded multi-currency demo invoices (USD, EUR, MAD).")

    except Exception as e:
        logger.warning(f"Initial seed notice: {e}")
        db.rollback()
    finally:
        db.close()

seed_initial_data()

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Enterprise AI Invoice Analyzer — Automated OCR, LLM extraction, human-in-the-loop review, and analytics.",
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url=f"{settings.API_V1_STR}/docs",
    redoc_url=f"{settings.API_V1_STR}/redoc"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount API Routers
app.include_router(health.router, prefix=settings.API_V1_STR)
app.include_router(auth.router, prefix=settings.API_V1_STR)
app.include_router(invoices.router, prefix=settings.API_V1_STR)
app.include_router(dashboard.router, prefix=settings.API_V1_STR)

@app.get("/")
def root():
    return {
        "message": "AI Invoice Analyzer API is running.",
        "docs": f"{settings.API_V1_STR}/docs"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
