# API Documentation

## Base URL
```
http://localhost:8000/api
```

## Authentication
Currently, the API does not require authentication. Future versions may include JWT-based authentication.

## Response Format
All API responses follow a consistent JSON format:

### Success Response
```json
{
  "data": {...},
  "message": "Success message",
  "status": "success"
}
```

### Error Response
```json
{
  "detail": "Error message",
  "status": "error"
}
```

## Endpoints

### Documents API

#### List All Documents
```http
GET /api/documents/
```

**Query Parameters:**
- `category` (optional): Filter by category (opord, warno, intel)
- `search` (optional): Search term for filtering documents

**Response:**
```json
[
  {
    "id": 1,
    "filename": "unique_filename.pdf",
    "original_name": "document.pdf",
    "category": "opord",
    "file_size": 1024000,
    "page_count": 10,
    "upload_date": "2023-12-01T10:00:00",
    "description": "Document description",
    "tags": ["tag1", "tag2"],
    "classification_level": "unclassified",
    "created_by": "user",
    "is_active": true
  }
]
```

#### List Documents by Category
```http
GET /api/documents/{category}
```

**Path Parameters:**
- `category`: Document category (opord, warno, intel)

**Response:** Same as list all documents, filtered by category.

#### Get Document Details
```http
GET /api/documents/doc/{document_id}
```

**Path Parameters:**
- `document_id`: Unique document identifier

**Response:**
```json
{
  "id": 1,
  "filename": "unique_filename.pdf",
  "original_name": "document.pdf",
  "category": "opord",
  "file_size": 1024000,
  "page_count": 10,
  "upload_date": "2023-12-01T10:00:00",
  "description": "Document description",
  "tags": ["tag1", "tag2"],
  "classification_level": "unclassified",
  "created_by": "user",
  "is_active": true
}
```

#### Download Document Content
```http
GET /api/documents/doc/{document_id}/content
```

**Path Parameters:**
- `document_id`: Unique document identifier

**Response:** PDF file stream with appropriate headers.

#### Get Document Page Preview
```http
GET /api/documents/doc/{document_id}/preview/{page}
```

**Path Parameters:**
- `document_id`: Unique document identifier
- `page`: Page number (1-based)

**Response:** PNG image stream of the specified page.

#### Search Within Document
```http
GET /api/documents/doc/{document_id}/search/{search_term}
```

**Path Parameters:**
- `document_id`: Unique document identifier
- `search_term`: Text to search for

**Response:**
```json
{
  "document_id": 1,
  "search_term": "example",
  "results": [
    {
      "page": 1,
      "matches": 2,
      "positions": [
        {"x0": 100, "y0": 200, "x1": 150, "y1": 220},
        {"x0": 300, "y0": 400, "x1": 350, "y1": 420}
      ]
    }
  ],
  "total_matches": 2
}
```

#### Extract Page Text
```http
GET /api/documents/doc/{document_id}/text/{page}
```

**Path Parameters:**
- `document_id`: Unique document identifier
- `page`: Page number (1-based)

**Response:**
```json
{
  "document_id": 1,
  "page": 1,
  "text": "Extracted text content from the page..."
}
```

#### Delete Document
```http
DELETE /api/documents/doc/{document_id}
```

**Path Parameters:**
- `document_id`: Unique document identifier

**Response:**
```json
{
  "message": "Document deleted successfully"
}
```

### Upload API

#### Upload Single Document
```http
POST /api/upload/single
```

**Form Data:**
- `file`: PDF file to upload
- `category`: Document category (opord, warno, intel)
- `description` (optional): Document description
- `tags` (optional): Comma-separated tags
- `classification_level` (optional): Classification level
- `created_by` (optional): Creator name

**Response:**
```json
{
  "id": 1,
  "filename": "document.pdf",
  "status": "success",
  "message": "File uploaded successfully",
  "document": {
    "id": 1,
    "filename": "unique_filename.pdf",
    "original_name": "document.pdf",
    "category": "opord",
    "file_size": 1024000,
    "page_count": 10,
    "upload_date": "2023-12-01T10:00:00",
    "description": "Document description",
    "tags": ["tag1", "tag2"],
    "classification_level": "unclassified",
    "created_by": "user",
    "is_active": true
  }
}
```

#### Upload Multiple Documents
```http
POST /api/upload/
```

**Form Data:**
- `files`: Multiple PDF files to upload
- `category`: Document category (opord, warno, intel)
- `description` (optional): Document description
- `tags` (optional): Comma-separated tags
- `classification_level` (optional): Classification level
- `created_by` (optional): Creator name

**Response:**
```json
{
  "uploaded_files": [
    {
      "id": 1,
      "filename": "document1.pdf",
      "status": "success",
      "message": "File uploaded successfully"
    },
    {
      "id": 2,
      "filename": "document2.pdf",
      "status": "success",
      "message": "File uploaded successfully"
    }
  ],
  "errors": [
    "document3.pdf: File size exceeds maximum limit"
  ],
  "total_uploaded": 2,
  "total_errors": 1
}
```

### System API

#### Health Check
```http
GET /api/health
```

**Response:**
```json
{
  "status": "healthy",
  "service": "military-pdf-viewer"
}
```

## Error Codes

### HTTP Status Codes
- `200`: Success
- `201`: Created
- `400`: Bad Request (invalid input)
- `404`: Not Found
- `413`: Payload Too Large (file size exceeded)
- `422`: Unprocessable Entity (validation error)
- `500`: Internal Server Error

### Common Errors

#### File Upload Errors
```json
{
  "detail": "Only PDF files are allowed"
}
```

```json
{
  "detail": "File size exceeds maximum limit"
}
```

```json
{
  "detail": "Invalid category"
}
```

#### Document Access Errors
```json
{
  "detail": "Document not found"
}
```

```json
{
  "detail": "File not found on disk"
}
```

#### PDF Processing Errors
```json
{
  "detail": "Error processing PDF: invalid file format"
}
```

```json
{
  "detail": "Page 15 does not exist"
}
```

## Rate Limiting
Currently, no rate limiting is implemented. Future versions may include rate limiting for upload endpoints.

## File Size Limits
- Maximum file size: 50MB (configurable via `UPLOAD_MAX_SIZE` environment variable)
- Supported format: PDF only

## Search Features
- Full-text search across document content
- Metadata search (filename, description, tags)
- Case-insensitive search
- Partial word matching

## Examples

### Upload a Document (curl)
```bash
curl -X POST "http://localhost:8000/api/upload/single" \
  -F "file=@document.pdf" \
  -F "category=opord" \
  -F "description=Mission planning document" \
  -F "tags=mission,planning" \
  -F "classification_level=unclassified"
```

### Search Documents (JavaScript)
```javascript
const response = await fetch('/api/documents/?search=mission');
const documents = await response.json();
console.log(documents);
```

### Download Document (JavaScript)
```javascript
const response = await fetch('/api/documents/doc/1/content');
const blob = await response.blob();
const url = URL.createObjectURL(blob);
window.open(url);
```

## Interactive Documentation
Visit `http://localhost:8000/docs` for interactive Swagger UI documentation where you can test all endpoints directly from the browser.