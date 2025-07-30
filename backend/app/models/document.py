from sqlalchemy import Column, Integer, String, DateTime, Boolean, Text, Enum
from sqlalchemy.sql import func
from app.database.connection import Base
import enum

class CategoryEnum(enum.Enum):
    opord = "opord"
    warno = "warno"
    intel = "intel"

class Document(Base):
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String(255), nullable=False)
    original_name = Column(String(255), nullable=False)
    category = Column(Enum(CategoryEnum), nullable=False)
    file_path = Column(String(500), nullable=False)
    file_size = Column(Integer, nullable=False)
    page_count = Column(Integer)
    upload_date = Column(DateTime(timezone=True), server_default=func.now())
    last_accessed = Column(DateTime(timezone=True), onupdate=func.now())
    description = Column(Text)
    tags = Column(String(500))
    classification_level = Column(String(50))
    created_by = Column(String(100))
    is_active = Column(Boolean, default=True)

    def to_dict(self):
        return {
            "id": self.id,
            "filename": self.filename,
            "original_name": self.original_name,
            "category": self.category.value if self.category else None,
            "file_size": self.file_size,
            "page_count": self.page_count,
            "upload_date": self.upload_date.isoformat() if self.upload_date else None,
            "last_accessed": self.last_accessed.isoformat() if self.last_accessed else None,
            "description": self.description,
            "tags": self.tags.split(",") if self.tags else [],
            "classification_level": self.classification_level,
            "created_by": self.created_by,
            "is_active": self.is_active
        }