from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from app.core.config import settings
from app.core.logging import logger

db_url = settings.DATABASE_URL

# Robust fallback: if PostgreSQL is specified but unreachable (e.g. local dev without Postgres running)
if db_url.startswith("postgresql"):
    try:
        test_engine = create_engine(db_url, connect_args={"connect_timeout": 2}, pool_pre_ping=True)
        with test_engine.connect() as conn:
            pass
    except Exception as e:
        logger.warning(f"PostgreSQL connection to {db_url} failed ({e}). Gracefully falling back to local SQLite database.")
        db_url = "sqlite:///./invoice_analyzer.db"

is_sqlite = db_url.startswith("sqlite")
connect_args = {"check_same_thread": False} if is_sqlite else {}

engine = create_engine(
    db_url,
    connect_args=connect_args,
    pool_pre_ping=True
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
