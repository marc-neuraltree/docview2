# Military PDF Viewer

A comprehensive web-based PDF viewer application designed for military tactical document management, featuring organized category-based navigation and professional document viewing capabilities.

## Features

### 🎯 Core Functionality
- **Three-Category Organization**: OPORD, WARNO, and INTEL document categories
- **Advanced PDF Viewing**: Zoom, navigation, fit-to-width, and fullscreen modes
- **Drag-and-Drop Upload**: Intuitive file upload with progress tracking
- **Document Management**: View, delete, and organize PDF documents
- **Full-Text Search**: Search across document names, descriptions, and content
- **Responsive Design**: Works on desktop, tablet, and mobile devices

### 📋 Document Categories
- **OPORD** (Operations Order): Mission planning and execution documents
- **WARNO** (Warning Order): Preliminary mission information and alerts
- **INTEL** (Intelligence): Intelligence reports and analysis documents

### 🔧 Technical Features
- **FastAPI Backend**: High-performance Python backend with automatic API documentation
- **PDF.js Integration**: Client-side PDF rendering without plugins
- **SQLite Database**: Lightweight document metadata storage
- **File Validation**: Security checks for PDF uploads
- **Real-time Updates**: Dynamic document listing and status updates

## Installation

### Prerequisites
- Python 3.8 or higher
- pip (Python package manager)
- Modern web browser with JavaScript enabled

### Quick Start

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd PDF-Viewerv2
   ```

2. **Set up Python virtual environment**
   ```bash
   cd backend
   python -m venv venv
   
   # On Windows:
   venv\\Scripts\\activate
   
   # On macOS/Linux:
   source venv/bin/activate
   ```

3. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Configure environment variables**
   ```bash
   cp .env.example .env
   # Edit .env file with your configuration
   ```

5. **Run the application**
   ```bash
   # From the project root directory
   python run.py
   ```

6. **Access the application**
   Open your web browser and navigate to: `http://localhost:8000`

## Project Structure

```
PDF-Viewerv2/
├── backend/
│   ├── app/
│   │   ├── models/           # Database models
│   │   ├── routers/          # API endpoints
│   │   ├── services/         # Business logic
│   │   ├── utils/            # Utility functions
│   │   └── database/         # Database configuration
│   ├── uploads/              # File storage
│   │   ├── opord/           # OPORD documents
│   │   ├── warno/           # WARNO documents
│   │   └── intel/           # INTEL documents
│   ├── requirements.txt      # Python dependencies
│   └── config.py            # Application configuration
├── frontend/
│   ├── css/                 # Stylesheets
│   ├── js/                  # JavaScript components
│   │   ├── components/      # UI components
│   │   ├── services/        # API and PDF services
│   │   └── utils/           # Utility functions
│   └── index.html           # Main application page
├── tests/                   # Test files
├── docs/                    # Documentation
├── run.py                   # Application launcher
└── README.md               # This file
```

## Usage Guide

### Uploading Documents

1. **Drag and Drop**: Drag PDF files directly onto the upload zones in each category
2. **Click to Upload**: Click on the upload zone to open the file browser
3. **Batch Upload**: Select multiple files to upload simultaneously

### Viewing Documents

1. **Select Document**: Click on any document in the left navigation panel
2. **Navigation**: Use arrow buttons or keyboard shortcuts to navigate pages
3. **Zoom Controls**: Use the zoom buttons or Ctrl+Up/Down arrows
4. **Fullscreen**: Press F11 or click the fullscreen button

### Keyboard Shortcuts

- **Ctrl + ←/→**: Previous/Next page
- **Ctrl + ↑/↓**: Zoom in/out
- **Ctrl + 0**: Fit to width
- **Ctrl + F**: Toggle fullscreen
- **F11**: Browser fullscreen

### Search Functionality

- **Global Search**: Use the search box at the bottom of the left panel
- **Real-time Results**: Search results update as you type
- **Multi-field Search**: Searches document names, descriptions, and tags

## API Documentation

### Base URL
```
http://localhost:8000/api
```

### Endpoints

#### Documents
- `GET /documents/` - List all documents
- `GET /documents/{category}` - List documents by category
- `GET /documents/doc/{id}` - Get document metadata
- `GET /documents/doc/{id}/content` - Download PDF content
- `GET /documents/doc/{id}/preview/{page}` - Get page preview image
- `DELETE /documents/doc/{id}` - Delete document

#### Upload
- `POST /upload/single` - Upload single document
- `POST /upload/` - Batch upload documents

#### Search
- `GET /documents/doc/{id}/search/{term}` - Search within document
- `GET /documents/doc/{id}/text/{page}` - Extract page text

### Interactive API Documentation
Visit `http://localhost:8000/docs` for interactive Swagger documentation.

## Configuration

### Environment Variables

Create a `.env` file in the backend directory:

```env
DATABASE_URL=sqlite:///./documents.db
SECRET_KEY=your-secret-key-here
UPLOAD_MAX_SIZE=52428800
ALLOWED_EXTENSIONS=pdf
CORS_ORIGINS=http://localhost:8000
```

### Configuration Options

- **DATABASE_URL**: Database connection string
- **SECRET_KEY**: Secret key for security features
- **UPLOAD_MAX_SIZE**: Maximum file size in bytes (default: 50MB)
- **ALLOWED_EXTENSIONS**: Allowed file extensions (currently PDF only)
- **CORS_ORIGINS**: Allowed CORS origins for API access

## Security Features

### File Upload Security
- **File Type Validation**: Only PDF files are accepted
- **Size Limits**: Configurable maximum file size
- **Content Validation**: PDF header verification
- **Path Sanitization**: Prevents directory traversal attacks

### Data Protection
- **SQL Injection Protection**: Parameterized queries with SQLAlchemy
- **Input Sanitization**: All user inputs are validated and sanitized
- **Error Handling**: Secure error messages that don't leak system information

## Troubleshooting

### Common Issues

1. **Port Already in Use**
   ```bash
   # Change the port in run.py or kill the process using port 8000
   lsof -ti:8000 | xargs kill -9
   ```

2. **Permission Denied for Uploads**
   ```bash
   # Ensure upload directories have proper permissions
   chmod 755 backend/uploads/
   chmod 755 backend/uploads/*/
   ```

3. **PDF Not Loading**
   - Check browser console for JavaScript errors
   - Verify PDF file is not corrupted
   - Ensure sufficient disk space

4. **Database Errors**
   ```bash
   # Delete and recreate database
   rm backend/documents.db
   python run.py  # Database will be recreated
   ```

### Performance Optimization

1. **Large Files**: For files larger than 50MB, increase `UPLOAD_MAX_SIZE`
2. **Many Documents**: Consider upgrading from SQLite to PostgreSQL
3. **Slow Loading**: Enable browser caching and consider CDN for static files

## Development

### Setting up Development Environment

1. **Backend Development**
   ```bash
   cd backend
   uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```

2. **Frontend Development**
   - Edit files in the `frontend/` directory
   - Changes are served directly by FastAPI
   - No build process required for development

### Running Tests

```bash
# Backend tests
cd backend
python -m pytest tests/

# Frontend tests (if implemented)
cd frontend
npm test
```

### Adding New Features

1. **Backend**: Add new routes in `app/routers/`
2. **Frontend**: Create components in `js/components/`
3. **Database**: Update models in `app/models/`
4. **Styles**: Add CSS in `css/` directory

## Deployment

### Production Deployment

1. **Environment Setup**
   ```bash
   export DATABASE_URL="postgresql://user:pass@localhost/db"
   export SECRET_KEY="production-secret-key"
   ```

2. **Using Docker** (recommended)
   ```bash
   docker build -t military-pdf-viewer .
   docker run -p 8000:8000 military-pdf-viewer
   ```

3. **Manual Deployment**
   ```bash
   pip install gunicorn
   gunicorn app.main:app -w 4 -k uvicorn.workers.UvicornWorker
   ```

### Production Considerations

- Use PostgreSQL instead of SQLite for production
- Set up proper SSL/TLS certificates
- Configure reverse proxy (nginx/Apache)
- Implement proper backup strategy
- Set up monitoring and logging

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License. See LICENSE file for details.

## Support

For support and questions:
- Check the troubleshooting section above
- Review the API documentation at `/docs`
- Create an issue in the repository

## Changelog

### Version 1.0.0
- Initial release
- Basic PDF viewing functionality
- Category-based organization
- File upload and management
- Search functionality
- Responsive design