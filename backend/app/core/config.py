import os
from typing import List
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "AI Invoice Analyzer"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api"

    # Database
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL",
        "postgresql://postgres:postgres@localhost:5432/invoice_analyzer"
    )

    # JWT Authentication
    JWT_SECRET: str = os.getenv("JWT_SECRET", "super_secret_jwt_key_min_32_chars_long_production")
    JWT_ALGORITHM: str = os.getenv("JWT_ALGORITHM", "HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "1440"))

    # AI Provider: 'mock' or 'llm'
    AI_PROVIDER: str = os.getenv("AI_PROVIDER", "mock")
    AI_API_KEY: str = os.getenv("AI_API_KEY", "")
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    GEMINI_MODEL: str = os.getenv("GEMINI_MODEL", "gemini-3.8-flash")

    # OCR Provider: 'mock' or 'tesseract'
    OCR_PROVIDER: str = os.getenv("OCR_PROVIDER", "mock")
    TESSERACT_CMD: str = os.getenv("TESSERACT_CMD", "/usr/bin/tesseract")

    # Uploads & Storage
    UPLOAD_DIR: str = os.getenv("UPLOAD_DIR", "./uploads")
    MAX_FILE_SIZE_MB: int = int(os.getenv("MAX_FILE_SIZE_MB", "10"))
    ALLOWED_EXTENSIONS: List[str] = [".pdf", ".jpg", ".jpeg", ".png"]
    ALLOWED_MIME_TYPES: List[str] = [
        "application/pdf",
        "image/jpeg",
        "image/jpg",
        "image/png"
    ]

    # CORS
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:5173",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173"
    ]

    class Config:
        case_sensitive = True
        env_file = ".env"

settings = Settings()
