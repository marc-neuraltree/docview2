# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A military PDF viewer application with category-based document organization (OPORD, WARNO, INTEL). FastAPI backend serves a vanilla JavaScript frontend with PDF.js integration for document viewing.

## Essential Commands

### Development Setup
```bash
# Automated setup (recommended)
./setup.sh

# Manual setup if needed
cd backend && python -m venv venv && source venv/bin/activate
pip install -r requirements.txt && cp .env.example .env && cd ..
```

### Running the Application  
```bash
# Standard development (from project root)
python run.py

# Backend only with hot reload
cd backend && uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Database Operations
```bash
# Reset database (auto-recreated on restart)
rm backend/documents.db && python run.py

# Manual table creation
cd backend && python -c "from app.database.connection import create_tables; create_tables()"
```

## Architecture Overview

### Backend Architecture (FastAPI + SQLAlchemy)
- **Document Model (`app/models/document.py`)**: Core SQLAlchemy model with enum-based categories
- **API Routers**: `app/routers/documents.py` (CRUD), `app/routers/upload.py` (file handling)
- **Directory Scanner**: Auto-discovery service that scans `backend/uploads/{category}/` on startup
- **File Storage**: Category-based directory structure (`opord/`, `warno/`, `intel/`)

### Frontend Architecture (Vanilla JS)
- **Component-Based**: `js/components/navigation.js` manages left panel, `js/components/pdf-viewer.js` handles viewing
- **Service Layer**: `js/services/api.js` for backend communication, `js/services/pdf-service.js` for PDF.js integration
- **Event-Driven**: Components communicate via DOM events and callbacks

### Key Design Patterns
- **File Path Resolution**: Backend uses `resolve_file_path()` function to map database records to filesystem
- **Category Enforcement**: Three hardcoded categories (`OPORD`, `WARNO`, `INTEL`) enforced across frontend/backend
- **PDF Continuous Scrolling**: Uses PDF.js with all-pages rendering for performance
- **Startup Directory Scan**: `app/main.py` automatically scans upload directories on startup to sync database

## Critical Files for Development

### Backend Core
- `backend/app/main.py` - FastAPI app setup, CORS, startup directory scan
- `backend/app/models/document.py` - SQLAlchemy model with category enum
- `backend/app/services/directory_scanner.py` - Auto-discovery of files in upload directories
- `backend/config.py` - Settings with environment variable loading

### Frontend Core  
- `frontend/js/services/pdf-service.js` - PDF.js integration with continuous scrolling
- `frontend/js/components/navigation.js` - Category management and file listing
- `frontend/css/main.css` - Design system with CSS custom properties

## Development Patterns

### Adding New Features
1. **Backend**: Add routes in `app/routers/`, models in `app/models/`, business logic in `app/services/`
2. **Frontend**: Components in `js/components/`, styles in CSS files, API calls in `js/services/api.js`

### Common Issues & Solutions

**PDF Loading Problems**: Check `frontend/js/services/pdf-service.js:loadPDF()` - verify continuous scrolling config and backend file path resolution

**File Upload Issues**: Check directory permissions `chmod 755 backend/uploads/*/` and CORS settings

**CSS Not Updating**: Cache busting uses version parameters `?v=1.x` in `index.html`

**Database Issues**: Reset with `rm backend/documents.db && python run.py`

## Key Endpoints
- `GET /api/documents/{category}` - List documents by category  
- `POST /api/upload/single` - Upload single document
- `GET /api/documents/doc/{id}/content` - Download PDF content
- `GET /docs` - Interactive API documentation

## Environment Configuration
```env
DATABASE_URL=sqlite:///./documents.db
SECRET_KEY=your-secret-key-here
UPLOAD_MAX_SIZE=52428800
CORS_ORIGINS=http://localhost:8000
```