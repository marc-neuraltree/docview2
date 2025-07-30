# CLAUDE.md - Military PDF Viewer Project

## Project Overview

This is a comprehensive web-based PDF viewer application designed for military tactical document management. The application features a professional navy/charcoal UI design with three-category organization: OPORD (Operations Orders), WARNO (Warning Orders), and INTEL (Intelligence documents).

## Technology Stack

- **Backend**: FastAPI with Python 3.8+
- **Database**: SQLite with SQLAlchemy ORM
- **Frontend**: Vanilla HTML/CSS/JavaScript (no framework dependencies)
- **PDF Processing**: PDF.js for client-side rendering, PyMuPDF for server-side processing
- **File Storage**: Local filesystem with category-based organization

## Quick Start Commands

### Development Setup
```bash
# Setup and run (automated script)
./setup.sh

# Manual setup
cd backend
python -m venv venv
source venv/bin/activate  # or venv\Scripts\activate on Windows
pip install -r requirements.txt
cp .env.example .env
cd ..
python run.py
```

### Running the Application
```bash
# From project root
python run.py

# Development mode with auto-reload
cd backend
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Database Operations
```bash
# Initialize database (done automatically by run.py)
cd backend
python -c "from app.database.connection import create_tables; create_tables()"
```

## Project Structure

```
PDF-Viewerv2/
├── backend/
│   ├── app/
│   │   ├── models/document.py         # SQLAlchemy document model
│   │   ├── routers/documents.py       # Document API endpoints
│   │   ├── routers/upload.py          # File upload endpoints
│   │   ├── services/                  # Business logic services
│   │   ├── utils/                     # Utility functions
│   │   └── database/connection.py     # Database configuration
│   ├── uploads/                       # Document storage directories
│   │   ├── opord/                     # OPORD documents
│   │   ├── warno/                     # WARNO documents
│   │   └── intel/                     # INTEL documents
│   ├── requirements.txt               # Python dependencies
│   └── config.py                      # Application configuration
├── frontend/
│   ├── css/
│   │   ├── main.css                   # Core styling and design system
│   │   ├── navigation.css             # Left panel navigation styles
│   │   └── pdf-viewer.css             # Right panel PDF viewer styles
│   ├── js/
│   │   ├── services/
│   │   │   ├── api.js                 # Backend API communication
│   │   │   └── pdf-service.js         # PDF.js integration and rendering
│   │   ├── components/
│   │   │   ├── navigation.js          # Document navigation management
│   │   │   └── pdf-viewer.js          # PDF viewer controls
│   │   └── main.js                    # Application initialization
│   └── index.html                     # Single-page application
├── run.py                             # Application launcher
├── setup.sh                           # Automated setup script
└── README.md                          # Comprehensive documentation
```

## Architecture Overview

### Backend Architecture
- **FastAPI Application**: Modern async Python web framework
- **SQLAlchemy Models**: Document metadata storage with enum-based categories
- **File Storage**: Category-based directory structure for PDF files
- **API Endpoints**: RESTful API with automatic OpenAPI documentation
- **CORS Configuration**: Enabled for frontend-backend communication

### Frontend Architecture
- **Component-Based**: Modular JavaScript classes for navigation and PDF viewing
- **Service Layer**: Separate API and PDF services for clean separation of concerns
- **Responsive Design**: Mobile-first CSS with professional design system
- **PDF.js Integration**: Client-side PDF rendering with continuous scrolling

### Key Design Patterns
- **MVC Pattern**: Clear separation between models (SQLAlchemy), views (HTML/CSS), and controllers (JavaScript classes)
- **Service Layer**: API calls abstracted into dedicated service classes
- **Event-Driven**: Component communication through DOM events and callbacks

## Design System

### Color Palette
```css
--primary-navy: #0F172A      /* Main background color */
--primary-dark: #1E293B      /* Secondary backgrounds */
--accent-blue: #3B82F6       /* Interactive elements */
--text-primary: #1F2937      /* Primary text */
--text-secondary: #6B7280    /* Secondary text */
--text-white: #FFFFFF        /* White text on dark backgrounds */
```

### Typography Hierarchy
- **Headers**: 28px-18px, font-weight 700, navy color
- **Body Text**: 16px-14px, font-weight 500, responsive sizing
- **Meta Text**: 13px-12px, font-weight 500, secondary color

### Component Styling
- **Buttons**: Rounded corners (8px), hover animations, shadow effects
- **Cards**: Border radius 12px, box shadows, gradient backgrounds
- **Upload Zones**: Sophisticated gradients, drag-and-drop animations

## Key Files and Their Purposes

### Critical Frontend Files
- `frontend/css/main.css` - Core design system, color variables, button styles
- `frontend/css/navigation.css` - Left panel styling, upload zones, file lists
- `frontend/css/pdf-viewer.css` - Right panel PDF viewer, controls, responsive design
- `frontend/js/services/pdf-service.js` - PDF.js integration, continuous scrolling rendering
- `frontend/js/components/navigation.js` - Document management, category handling

### Critical Backend Files
- `backend/app/main.py` - FastAPI application setup, CORS, static file serving
- `backend/app/models/document.py` - SQLAlchemy document model with categories enum
- `backend/app/routers/documents.py` - Document CRUD operations, file serving
- `backend/app/routers/upload.py` - File upload handling with validation

### Configuration Files
- `backend/.env.example` - Environment variables template
- `backend/requirements.txt` - Python dependencies
- `backend/config.py` - Application configuration settings

## Development Workflow

### Testing the Application
```bash
# Access the application
http://localhost:8000

# API documentation
http://localhost:8000/docs

# Upload test documents to backend/uploads/[category]/ directories
```

### Adding New Features

1. **Backend Changes**:
   - Add routes in `app/routers/`
   - Update models in `app/models/`
   - Add business logic in `app/services/`

2. **Frontend Changes**:
   - Create components in `js/components/`
   - Add styles in appropriate CSS files
   - Update API calls in `js/services/api.js`

### Common Issues and Solutions

1. **PDF Loading Problems**:
   - Check `frontend/js/services/pdf-service.js:loadPDF()` method
   - Ensure continuous scrolling is properly configured
   - Verify file paths are resolved correctly in backend

2. **File Upload Issues**:
   - Check upload directory permissions: `chmod 755 backend/uploads/*/`
   - Verify file size limits in backend configuration
   - Check CORS settings for file uploads

3. **CSS Not Updating**:
   - Cache busting implemented with version parameters `?v=1.x`
   - Update version numbers in `index.html` for cache invalidation

4. **Database Issues**:
   - Delete and recreate: `rm backend/documents.db && python run.py`
   - Check SQLAlchemy models in `app/models/document.py`

## Security Considerations

- **File Upload Validation**: PDF-only uploads with header verification
- **Path Sanitization**: Prevents directory traversal attacks
- **SQL Injection Protection**: Parameterized queries with SQLAlchemy
- **Input Sanitization**: All user inputs validated and sanitized

## Performance Notes

- **PDF Rendering**: Uses continuous scrolling for better performance
- **Thumbnail Generation**: Currently disabled to focus on core functionality
- **File Storage**: Local filesystem storage for development/small deployments
- **Database**: SQLite suitable for development; consider PostgreSQL for production

## Recent Changes and Fixes

1. **UI Modernization**: Complete redesign with navy/charcoal professional theme
2. **PDF Loading**: Fixed to use continuous scrolling with all-pages rendering
3. **File Path Resolution**: Added `resolve_file_path()` for proper backend file handling
4. **Responsive Design**: Enhanced mobile experience with slide-out navigation
5. **Directory Scanner**: Added automatic file discovery functionality

## Deployment Notes

- **Development**: Use `python run.py` for local development
- **Production**: Consider gunicorn with multiple workers
- **Database**: Upgrade to PostgreSQL for production use
- **File Storage**: Consider cloud storage for scalable deployments
- **SSL/TLS**: Configure proper certificates for production

## Environment Variables

```env
DATABASE_URL=sqlite:///./documents.db
SECRET_KEY=your-secret-key-here
UPLOAD_MAX_SIZE=52428800
ALLOWED_EXTENSIONS=pdf
CORS_ORIGINS=http://localhost:8000
```

## API Endpoints Summary

- `GET /api/documents/` - List all documents
- `GET /api/documents/{category}` - List documents by category
- `POST /api/upload/single` - Upload single document
- `GET /api/documents/doc/{id}/content` - Download PDF content
- `DELETE /api/documents/doc/{id}` - Delete document
- `GET /docs` - Interactive API documentation

This application represents a complete, professional military document management system with modern UI design, robust PDF viewing capabilities, and scalable architecture.