import os
import uuid
from datetime import datetime
from typing import List, Dict
from sqlalchemy.orm import Session

from app.models.document import Document, CategoryEnum
from app.services.pdf_processor import PDFProcessor
from config import settings
import os

class DirectoryScanner:
    def __init__(self):
        self.pdf_processor = PDFProcessor()
        self.categories = ['opord', 'warno', 'intel']
    
    def scan_all_directories(self, db: Session) -> Dict[str, List[str]]:
        """Scan all category directories and return results"""
        results = {
            'added': [],
            'updated': [],
            'errors': []
        }
        
        for category in self.categories:
            try:
                category_results = self.scan_category_directory(category, db)
                results['added'].extend(category_results['added'])
                results['updated'].extend(category_results['updated'])
                results['errors'].extend(category_results['errors'])
            except Exception as e:
                results['errors'].append(f"Error scanning {category} directory: {str(e)}")
        
        return results
    
    def scan_category_directory(self, category: str, db: Session) -> Dict[str, List[str]]:
        """Scan a specific category directory for PDF files"""
        results = {
            'added': [],
            'updated': [],
            'errors': []
        }
        
        # Get the absolute path to the category directory
        category_dir = os.path.join(settings.UPLOAD_DIRECTORY, category)
        # Make it relative to the root directory for database storage
        relative_category_dir = os.path.join('.', 'uploads', category)
        
        if not os.path.exists(category_dir):
            os.makedirs(category_dir, exist_ok=True)
            return results
        
        try:
            category_enum = CategoryEnum(category)
        except ValueError:
            results['errors'].append(f"Invalid category: {category}")
            return results
        
        # Get all PDF files in the directory
        pdf_files = []
        for filename in os.listdir(category_dir):
            if filename.lower().endswith('.pdf'):
                file_path = os.path.join(category_dir, filename)
                if os.path.isfile(file_path):
                    pdf_files.append((filename, file_path))
        
        for filename, file_path in pdf_files:
            try:
                # Create relative path for database storage
                relative_file_path = os.path.join(relative_category_dir, filename)
                
                # Check if file already exists in database
                existing_doc = db.query(Document).filter(
                    Document.original_name == filename,
                    Document.category == category_enum
                ).first()
                
                if existing_doc:
                    # Check if file has been modified
                    file_stat = os.stat(file_path)
                    if file_stat.st_mtime > existing_doc.upload_date.timestamp():
                        # File has been modified, update metadata
                        self._update_document_metadata(existing_doc, relative_file_path, db)
                        results['updated'].append(f"{category}/{filename}")
                else:
                    # New file, add to database
                    self._add_document_to_db(filename, relative_file_path, category_enum, db)
                    results['added'].append(f"{category}/{filename}")
                    
            except Exception as e:
                results['errors'].append(f"Error processing {category}/{filename}: {str(e)}")
        
        return results
    
    def _add_document_to_db(self, filename: str, relative_file_path: str, category: CategoryEnum, db: Session):
        """Add a new document to the database"""
        try:
            # Resolve the absolute path for file operations
            absolute_file_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), relative_file_path[2:])
            
            # Get file size
            file_size = os.path.getsize(absolute_file_path)
            
            # Extract PDF metadata
            metadata = self.pdf_processor.extract_metadata(absolute_file_path)
            page_count = metadata.get("page_count", 0)
            
            # Create unique filename for database
            unique_filename = f"{uuid.uuid4()}_{filename}"
            
            # Create document record
            document = Document(
                filename=unique_filename,
                original_name=filename,
                category=category,
                file_path=relative_file_path,
                file_size=file_size,
                page_count=page_count,
                description=f"Auto-imported {category.value} document",
                tags="",
                classification_level="",
                created_by="System"
            )
            
            db.add(document)
            db.commit()
            db.refresh(document)
            
        except Exception as e:
            db.rollback()
            raise e
    
    def _update_document_metadata(self, document: Document, relative_file_path: str, db: Session):
        """Update document metadata if file has changed"""
        try:
            # Resolve the absolute path for file operations
            absolute_file_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), relative_file_path[2:])
            
            # Get updated file size
            file_size = os.path.getsize(absolute_file_path)
            
            # Extract updated PDF metadata
            metadata = self.pdf_processor.extract_metadata(absolute_file_path)
            page_count = metadata.get("page_count", 0)
            
            # Update document
            document.file_size = file_size
            document.page_count = page_count
            document.upload_date = datetime.utcnow()
            
            db.commit()
            
        except Exception as e:
            db.rollback()
            raise e
    
    def get_document_count_by_category(self, category: str) -> int:
        """Get the number of documents in a category"""
        try:
            category_enum = CategoryEnum(category)
            return len(self._get_pdf_files_in_category(category))
        except ValueError:
            return 0
    
    def _get_pdf_files_in_category(self, category: str) -> List[str]:
        """Get list of PDF files in a category directory"""
        category_dir = os.path.join(settings.UPLOAD_DIRECTORY, category)
        
        if not os.path.exists(category_dir):
            return []
        
        pdf_files = []
        for filename in os.listdir(category_dir):
            if filename.lower().endswith('.pdf'):
                file_path = os.path.join(category_dir, filename)
                if os.path.isfile(file_path):
                    pdf_files.append(filename)
        
        return pdf_files 