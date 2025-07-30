from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from typing import List
import os
import uuid
import shutil
from datetime import datetime

from app.database.connection import get_db
from app.models.document import Document, CategoryEnum
from app.services.pdf_processor import PDFProcessor
from app.services.file_manager import FileManager
from config import settings

router = APIRouter()

@router.post("/")
async def upload_documents(
    files: List[UploadFile] = File(...),
    category: str = Form(...),
    description: str = Form(""),
    tags: str = Form(""),
    classification_level: str = Form(""),
    created_by: str = Form("System"),
    db: Session = Depends(get_db)
):
    try:
        category_enum = CategoryEnum(category)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid category")
    
    file_manager = FileManager()
    pdf_processor = PDFProcessor()
    uploaded_files = []
    errors = []
    
    for file in files:
        try:
            if not file.filename.lower().endswith('.pdf'):
                errors.append(f"{file.filename}: Only PDF files are allowed")
                continue
            
            if file.size > settings.UPLOAD_MAX_SIZE:
                errors.append(f"{file.filename}: File size exceeds maximum limit")
                continue
            
            unique_filename = f"{uuid.uuid4()}_{file.filename}"
            file_path = file_manager.save_file(file, category, unique_filename)
            
            try:
                metadata = pdf_processor.extract_metadata(file_path)
                page_count = metadata["page_count"]
            except Exception as e:
                os.remove(file_path)
                errors.append(f"{file.filename}: Error processing PDF - {str(e)}")
                continue
            
            document = Document(
                filename=unique_filename,
                original_name=file.filename,
                category=category_enum,
                file_path=file_path,
                file_size=file.size,
                page_count=page_count,
                description=description,
                tags=tags,
                classification_level=classification_level,
                created_by=created_by
            )
            
            db.add(document)
            db.commit()
            db.refresh(document)
            
            uploaded_files.append({
                "id": document.id,
                "filename": document.original_name,
                "status": "success",
                "message": "File uploaded successfully"
            })
            
        except Exception as e:
            errors.append(f"{file.filename}: {str(e)}")
    
    return {
        "uploaded_files": uploaded_files,
        "errors": errors,
        "total_uploaded": len(uploaded_files),
        "total_errors": len(errors)
    }

@router.post("/single")
async def upload_single_document(
    file: UploadFile = File(...),
    category: str = Form(...),
    description: str = Form(""),
    tags: str = Form(""),
    classification_level: str = Form(""),
    created_by: str = Form("System"),
    db: Session = Depends(get_db)
):
    try:
        category_enum = CategoryEnum(category)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid category")
    
    if not file.filename.lower().endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Only PDF files are allowed")
    
    if file.size > settings.UPLOAD_MAX_SIZE:
        raise HTTPException(status_code=400, detail="File size exceeds maximum limit")
    
    file_manager = FileManager()
    pdf_processor = PDFProcessor()
    
    try:
        unique_filename = f"{uuid.uuid4()}_{file.filename}"
        file_path = file_manager.save_file(file, category, unique_filename)
        
        try:
            metadata = pdf_processor.extract_metadata(file_path)
            page_count = metadata["page_count"]
        except Exception as e:
            os.remove(file_path)
            raise HTTPException(status_code=400, detail=f"Error processing PDF: {str(e)}")
        
        document = Document(
            filename=unique_filename,
            original_name=file.filename,
            category=category_enum,
            file_path=file_path,
            file_size=file.size,
            page_count=page_count,
            description=description,
            tags=tags,
            classification_level=classification_level,
            created_by=created_by
        )
        
        db.add(document)
        db.commit()
        db.refresh(document)
        
        return {
            "id": document.id,
            "filename": document.original_name,
            "status": "success",
            "message": "File uploaded successfully",
            "document": document.to_dict()
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")

@router.get("/progress/{upload_id}")
async def get_upload_progress(upload_id: str):
    return {"upload_id": upload_id, "status": "completed", "progress": 100}