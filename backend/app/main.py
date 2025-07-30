from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
import os

from app.routers import documents, upload
from app.database.connection import create_tables
from app.services.directory_scanner import DirectoryScanner
from config import settings

app = FastAPI(
    title="Military PDF Viewer API",
    description="API for military tactical document management",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

create_tables()

# Initialize directory scanner and scan for documents on startup
@app.on_event("startup")
async def startup_event():
    from app.database.connection import SessionLocal
    db = SessionLocal()
    try:
        scanner = DirectoryScanner()
        results = scanner.scan_all_directories(db)
        summary = {
            "added": len(results['added']),
            "updated": len(results['updated']),
            "errors": len(results['errors'])
        }
        print(f"Startup scan results: {summary}")
    except Exception as e:
        print(f"Startup scan error: {e}")
    finally:
        db.close()

app.include_router(documents.router, prefix="/api/documents", tags=["documents"])
app.include_router(upload.router, prefix="/api/upload", tags=["upload"])

# Get the project root directory (one level up from backend)
project_root = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
frontend_dir = os.path.join(project_root, "frontend")

app.mount("/static", StaticFiles(directory=frontend_dir), name="static")

@app.get("/")
async def read_root():
    return FileResponse(os.path.join(frontend_dir, "index.html"))

@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "military-pdf-viewer"}

@app.get("/api/health")
async def api_health_check():
    return {"status": "healthy", "service": "military-pdf-viewer"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)