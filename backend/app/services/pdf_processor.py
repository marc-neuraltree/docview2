import fitz
from PIL import Image
import io
from typing import Optional

class PDFProcessor:
    def __init__(self):
        pass
    
    def get_page_count(self, file_path: str) -> int:
        try:
            doc = fitz.open(file_path)
            page_count = len(doc)
            doc.close()
            return page_count
        except Exception as e:
            raise Exception(f"Error reading PDF: {str(e)}")
    
    def extract_metadata(self, file_path: str) -> dict:
        try:
            doc = fitz.open(file_path)
            metadata = doc.metadata
            page_count = len(doc)
            doc.close()
            
            return {
                "page_count": page_count,
                "title": metadata.get("title", ""),
                "author": metadata.get("author", ""),
                "subject": metadata.get("subject", ""),
                "creator": metadata.get("creator", ""),
                "producer": metadata.get("producer", ""),
                "created": metadata.get("creationDate", ""),
                "modified": metadata.get("modDate", "")
            }
        except Exception as e:
            raise Exception(f"Error extracting metadata: {str(e)}")
    
    def generate_page_image(self, file_path: str, page_num: int = 0, dpi: int = 150) -> io.BytesIO:
        try:
            doc = fitz.open(file_path)
            if page_num >= len(doc):
                raise Exception(f"Page {page_num + 1} does not exist")
            
            page = doc.load_page(page_num)
            mat = fitz.Matrix(dpi / 72, dpi / 72)
            pix = page.get_pixmap(matrix=mat)
            
            img_data = pix.tobytes("png")
            doc.close()
            
            return io.BytesIO(img_data)
        except Exception as e:
            raise Exception(f"Error generating page image: {str(e)}")
    
    def extract_text_from_page(self, file_path: str, page_num: int = 0) -> str:
        try:
            doc = fitz.open(file_path)
            if page_num >= len(doc):
                raise Exception(f"Page {page_num + 1} does not exist")
            
            page = doc.load_page(page_num)
            text = page.get_text()
            doc.close()
            
            return text
        except Exception as e:
            raise Exception(f"Error extracting text: {str(e)}")
    
    def search_text_in_pdf(self, file_path: str, search_term: str) -> list:
        try:
            doc = fitz.open(file_path)
            results = []
            
            for page_num in range(len(doc)):
                page = doc.load_page(page_num)
                text_instances = page.search_for(search_term)
                
                if text_instances:
                    results.append({
                        "page": page_num + 1,
                        "matches": len(text_instances),
                        "positions": [{"x0": inst.x0, "y0": inst.y0, "x1": inst.x1, "y1": inst.y1} 
                                    for inst in text_instances]
                    })
            
            doc.close()
            return results
        except Exception as e:
            raise Exception(f"Error searching text: {str(e)}")