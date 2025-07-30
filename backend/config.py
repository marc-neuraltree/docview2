import os
from typing import List
from dotenv import load_dotenv

load_dotenv()

class Settings:
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./documents.db")
    SECRET_KEY: str = os.getenv("SECRET_KEY", "your-secret-key-change-in-production")
    UPLOAD_MAX_SIZE: int = int(os.getenv("UPLOAD_MAX_SIZE", "52428800"))  # 50MB
    ALLOWED_EXTENSIONS: List[str] = ["pdf"]
    CORS_ORIGINS: List[str] = os.getenv("CORS_ORIGINS", "http://localhost:8000").split(",")
    UPLOAD_DIRECTORY: str = "./uploads"
    CATEGORIES: List[str] = ["opord", "warno", "intel"]

settings = Settings()