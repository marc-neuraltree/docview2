from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse, FileResponse
from sqlalchemy.orm import Session
from typing import List, Optional
import os

from app.database.connection import get_db
from app.models.document import Document, CategoryEnum
from app.services.pdf_processor import PDFProcessor
from app.services.directory_scanner import DirectoryScanner
from config import settings

router = APIRouter()

def resolve_file_path(file_path: str) -> str:
    """Resolve file path relative to the application root"""
    if file_path.startswith('./'):
        # Get the directory where the application is running from
        import os
        app_root = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
        return os.path.join(app_root, file_path[2:])  # Remove './' prefix
    return file_path

@router.get("/", response_model=List[dict])
async def list_documents(
    category: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    query = db.query(Document).filter(Document.is_active == True)
    
    if category:
        try:
            category_enum = CategoryEnum(category)
            query = query.filter(Document.category == category_enum)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid category")
    
    if search:
        query = query.filter(
            Document.original_name.contains(search) |
            Document.description.contains(search) |
            Document.tags.contains(search)
        )
    
    documents = query.order_by(Document.upload_date.desc()).all()
    return [doc.to_dict() for doc in documents]

@router.get("/{category}")
async def list_documents_by_category(
    category: str,
    db: Session = Depends(get_db)
):
    try:
        category_enum = CategoryEnum(category)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid category")
    
    documents = db.query(Document).filter(
        Document.category == category_enum,
        Document.is_active == True
    ).order_by(Document.upload_date.desc()).all()
    
    return [doc.to_dict() for doc in documents]

@router.get("/doc/{document_id}")
async def get_document(document_id: int, db: Session = Depends(get_db)):
    document = db.query(Document).filter(
        Document.id == document_id,
        Document.is_active == True
    ).first()
    
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    
    return document.to_dict()

@router.get("/doc/{document_id}/content")
async def get_document_content(document_id: int, db: Session = Depends(get_db)):
    document = db.query(Document).filter(
        Document.id == document_id,
        Document.is_active == True
    ).first()
    
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    
    resolved_path = resolve_file_path(document.file_path)
    if not os.path.exists(resolved_path):
        raise HTTPException(status_code=404, detail="File not found on disk")
    
    return FileResponse(
        resolved_path,
        media_type="application/pdf",
        filename=document.original_name
    )

@router.get("/doc/{document_id}/preview/{page}")
async def get_document_preview(
    document_id: int, 
    page: int,
    db: Session = Depends(get_db)
):
    document = db.query(Document).filter(
        Document.id == document_id,
        Document.is_active == True
    ).first()
    
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    
    resolved_path = resolve_file_path(document.file_path)
    if not os.path.exists(resolved_path):
        raise HTTPException(status_code=404, detail="File not found on disk")
    
    pdf_processor = PDFProcessor()
    try:
        image_data = pdf_processor.generate_page_image(resolved_path, page - 1)
        return StreamingResponse(
            image_data,
            media_type="image/png"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating preview: {str(e)}")

@router.get("/doc/{document_id}/search/{search_term}")
async def search_in_document(
    document_id: int,
    search_term: str,
    db: Session = Depends(get_db)
):
    document = db.query(Document).filter(
        Document.id == document_id,
        Document.is_active == True
    ).first()
    
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    
    resolved_path = resolve_file_path(document.file_path)
    if not os.path.exists(resolved_path):
        raise HTTPException(status_code=404, detail="File not found on disk")
    
    pdf_processor = PDFProcessor()
    try:
        search_results = pdf_processor.search_text_in_pdf(resolved_path, search_term)
        return {
            "document_id": document_id,
            "search_term": search_term,
            "results": search_results,
            "total_matches": sum(result["matches"] for result in search_results)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Search failed: {str(e)}")

@router.get("/doc/{document_id}/text/{page}")
async def get_page_text(
    document_id: int,
    page: int,
    db: Session = Depends(get_db)
):
    document = db.query(Document).filter(
        Document.id == document_id,
        Document.is_active == True
    ).first()
    
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    
    resolved_path = resolve_file_path(document.file_path)
    if not os.path.exists(resolved_path):
        raise HTTPException(status_code=404, detail="File not found on disk")
    
    pdf_processor = PDFProcessor()
    try:
        text = pdf_processor.extract_text_from_page(resolved_path, page - 1)
        return {
            "document_id": document_id,
            "page": page,
            "text": text
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Text extraction failed: {str(e)}")

@router.delete("/doc/{document_id}")
async def delete_document(document_id: int, db: Session = Depends(get_db)):
    document = db.query(Document).filter(
        Document.id == document_id,
        Document.is_active == True
    ).first()
    
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    
    document.is_active = False
    db.commit()
    
    return {"message": "Document deleted successfully"}

@router.post("/scan-directories")
async def scan_directories(db: Session = Depends(get_db)):
    """Scan all category directories for new PDF files"""
    try:
        scanner = DirectoryScanner()
        results = scanner.scan_all_directories(db)
        
        return {
            "message": "Directory scan completed",
            "results": results,
            "summary": {
                "added": len(results['added']),
                "updated": len(results['updated']),
                "errors": len(results['errors'])
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Directory scan failed: {str(e)}")

@router.post("/scan-directories/{category}")
async def scan_category_directory(category: str, db: Session = Depends(get_db)):
    """Scan a specific category directory for new PDF files"""
    try:
        scanner = DirectoryScanner()
        results = scanner.scan_category_directory(category, db)
        
        return {
            "message": f"Category {category} scan completed",
            "results": results,
            "summary": {
                "added": len(results['added']),
                "updated": len(results['updated']),
                "errors": len(results['errors'])
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Category scan failed: {str(e)}")