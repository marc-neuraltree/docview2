import os
import magic
from typing import List, Optional
from fastapi import UploadFile, HTTPException
from config import settings

class FileValidator:
    def __init__(self):
        self.max_size = settings.UPLOAD_MAX_SIZE
        self.allowed_extensions = settings.ALLOWED_EXTENSIONS
    
    def validate_file_extension(self, filename: str) -> bool:
        if not filename:
            return False
        
        extension = filename.lower().split('.')[-1]
        return extension in self.allowed_extensions
    
    def validate_file_size(self, file_size: int) -> bool:
        return file_size <= self.max_size
    
    def validate_file_type(self, file_content: bytes) -> bool:
        try:
            file_type = magic.from_buffer(file_content, mime=True)
            return file_type == 'application/pdf'
        except Exception:
            return False
    
    def validate_upload_file(self, file: UploadFile) -> dict:
        errors = []
        
        if not self.validate_file_extension(file.filename):
            errors.append(f"File extension not allowed. Allowed: {', '.join(self.allowed_extensions)}")
        
        if not self.validate_file_size(file.size):
            errors.append(f"File size too large. Maximum: {self.max_size / (1024*1024):.1f}MB")
        
        return {
            "valid": len(errors) == 0,
            "errors": errors
        }
    
    def validate_category(self, category: str) -> bool:
        return category in settings.CATEGORIES
    
    def sanitize_filename(self, filename: str) -> str:
        invalid_chars = '<>:"/\\|?*'
        for char in invalid_chars:
            filename = filename.replace(char, '_')
        
        filename = filename.strip()
        
        if len(filename) > 255:
            name, ext = os.path.splitext(filename)
            filename = name[:255-len(ext)] + ext
        
        return filename

class SecurityValidator:
    @staticmethod
    def is_safe_path(path: str, base_path: str) -> bool:
        try:
            abs_path = os.path.abspath(path)
            abs_base = os.path.abspath(base_path)
            return abs_path.startswith(abs_base)
        except Exception:
            return False
    
    @staticmethod
    def validate_pdf_content(file_path: str) -> bool:
        try:
            with open(file_path, 'rb') as f:
                header = f.read(8)
                return header.startswith(b'%PDF-')
        except Exception:
            return False