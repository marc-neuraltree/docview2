import os
import shutil
from fastapi import UploadFile
from config import settings

class FileManager:
    def __init__(self):
        self.upload_directory = settings.UPLOAD_DIRECTORY
        self.ensure_directories_exist()
    
    def ensure_directories_exist(self):
        for category in settings.CATEGORIES:
            category_path = os.path.join(self.upload_directory, category)
            os.makedirs(category_path, exist_ok=True)
    
    def save_file(self, file: UploadFile, category: str, filename: str) -> str:
        if category not in settings.CATEGORIES:
            raise ValueError(f"Invalid category: {category}")
        
        category_path = os.path.join(self.upload_directory, category)
        file_path = os.path.join(category_path, filename)
        
        try:
            with open(file_path, "wb") as buffer:
                shutil.copyfileobj(file.file, buffer)
            return file_path
        except Exception as e:
            raise Exception(f"Failed to save file: {str(e)}")
    
    def delete_file(self, file_path: str) -> bool:
        try:
            if os.path.exists(file_path):
                os.remove(file_path)
                return True
            return False
        except Exception as e:
            raise Exception(f"Failed to delete file: {str(e)}")
    
    def get_file_size(self, file_path: str) -> int:
        try:
            return os.path.getsize(file_path)
        except Exception:
            return 0
    
    def file_exists(self, file_path: str) -> bool:
        return os.path.exists(file_path)
    
    def move_file(self, old_path: str, new_category: str, new_filename: str) -> str:
        if new_category not in settings.CATEGORIES:
            raise ValueError(f"Invalid category: {new_category}")
        
        new_category_path = os.path.join(self.upload_directory, new_category)
        new_file_path = os.path.join(new_category_path, new_filename)
        
        try:
            shutil.move(old_path, new_file_path)
            return new_file_path
        except Exception as e:
            raise Exception(f"Failed to move file: {str(e)}")
    
    def get_directory_size(self, category: str = None) -> int:
        if category:
            if category not in settings.CATEGORIES:
                raise ValueError(f"Invalid category: {category}")
            directory = os.path.join(self.upload_directory, category)
        else:
            directory = self.upload_directory
        
        total_size = 0
        try:
            for dirpath, dirnames, filenames in os.walk(directory):
                for filename in filenames:
                    filepath = os.path.join(dirpath, filename)
                    total_size += os.path.getsize(filepath)
            return total_size
        except Exception:
            return 0