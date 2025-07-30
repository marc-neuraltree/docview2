# Deployment Guide

This document provides comprehensive instructions for deploying the Military PDF Viewer application in various environments.

## Table of Contents
- [Development Deployment](#development-deployment)
- [Production Deployment](#production-deployment)
- [Docker Deployment](#docker-deployment)
- [Cloud Deployment](#cloud-deployment)
- [Security Considerations](#security-considerations)
- [Monitoring and Maintenance](#monitoring-and-maintenance)

## Development Deployment

### Local Development Setup

1. **Prerequisites**
   ```bash
   # Check Python version (3.8+ required)
   python --version
   
   # Check pip
   pip --version
   ```

2. **Environment Setup**
   ```bash
   # Clone repository
   git clone <repository-url>
   cd PDF-Viewerv2
   
   # Create virtual environment
   cd backend
   python -m venv venv
   
   # Activate virtual environment
   # Windows:
   venv\Scripts\activate
   # macOS/Linux:
   source venv/bin/activate
   
   # Install dependencies
   pip install -r requirements.txt
   ```

3. **Configuration**
   ```bash
   # Copy environment template
   cp .env.example .env
   
   # Edit configuration
   # Set DATABASE_URL, SECRET_KEY, etc.
   ```

4. **Run Development Server**
   ```bash
   # From project root
   python run.py
   
   # Or directly with uvicorn
   cd backend
   uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```

5. **Access Application**
   - Application: http://localhost:8000
   - API Documentation: http://localhost:8000/docs

## Production Deployment

### System Requirements

**Minimum Requirements:**
- CPU: 2 cores
- RAM: 4GB
- Storage: 20GB + document storage
- OS: Linux (Ubuntu 20.04+ recommended)

**Recommended Requirements:**
- CPU: 4+ cores
- RAM: 8GB+
- Storage: 100GB+ SSD
- OS: Linux (Ubuntu 22.04 LTS)

### Production Setup

1. **System Preparation**
   ```bash
   # Update system
   sudo apt update && sudo apt upgrade -y
   
   # Install Python and dependencies
   sudo apt install python3 python3-pip python3-venv nginx supervisor -y
   
   # Create application user
   sudo adduser pdfviewer
   sudo usermod -aG www-data pdfviewer
   ```

2. **Application Setup**
   ```bash
   # Switch to application user
   sudo su - pdfviewer
   
   # Clone and setup application
   git clone <repository-url> /home/pdfviewer/app
   cd /home/pdfviewer/app/backend
   
   # Create production environment
   python3 -m venv venv
   source venv/bin/activate
   pip install -r requirements.txt
   pip install gunicorn
   ```

3. **Configuration**
   ```bash
   # Create production environment file
   cat > .env << EOF
   DATABASE_URL=sqlite:///./production.db
   SECRET_KEY=$(openssl rand -hex 32)
   UPLOAD_MAX_SIZE=104857600
   ALLOWED_EXTENSIONS=pdf
   CORS_ORIGINS=https://yourdomain.com
   EOF
   
   # Set proper permissions
   chmod 600 .env
   ```

4. **Database Setup**
   ```bash
   # Initialize database
   cd /home/pdfviewer/app
   python -c "from backend.app.database.connection import create_tables; create_tables()"
   ```

5. **Gunicorn Configuration**
   ```bash
   # Create gunicorn configuration
   cat > /home/pdfviewer/app/gunicorn.conf.py << EOF
   bind = "127.0.0.1:8000"
   workers = 4
   worker_class = "uvicorn.workers.UvicornWorker"
   worker_connections = 1000
   max_requests = 1000
   max_requests_jitter = 100
   timeout = 30
   keepalive = 2
   user = "pdfviewer"
   group = "www-data"
   chdir = "/home/pdfviewer/app/backend"
   daemon = False
   pidfile = "/home/pdfviewer/app/gunicorn.pid"
   accesslog = "/home/pdfviewer/app/logs/access.log"
   errorlog = "/home/pdfviewer/app/logs/error.log"
   loglevel = "info"
   EOF
   
   # Create logs directory
   mkdir -p /home/pdfviewer/app/logs
   ```

6. **Supervisor Configuration**
   ```bash
   # Create supervisor configuration
   sudo cat > /etc/supervisor/conf.d/pdfviewer.conf << EOF
   [program:pdfviewer]
   command=/home/pdfviewer/app/backend/venv/bin/gunicorn app.main:app -c /home/pdfviewer/app/gunicorn.conf.py
   directory=/home/pdfviewer/app/backend
   user=pdfviewer
   autostart=true
   autorestart=true
   redirect_stderr=true
   stdout_logfile=/home/pdfviewer/app/logs/supervisor.log
   environment=PATH="/home/pdfviewer/app/backend/venv/bin"
   EOF
   
   # Update supervisor
   sudo supervisorctl reread
   sudo supervisorctl update
   sudo supervisorctl start pdfviewer
   ```

7. **Nginx Configuration**
   ```bash
   # Create nginx configuration
   sudo cat > /etc/nginx/sites-available/pdfviewer << EOF
   server {
       listen 80;
       server_name yourdomain.com www.yourdomain.com;
       
       client_max_body_size 100M;
       
       location / {
           proxy_pass http://127.0.0.1:8000;
           proxy_set_header Host \$host;
           proxy_set_header X-Real-IP \$remote_addr;
           proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto \$scheme;
           proxy_read_timeout 300s;
           proxy_connect_timeout 75s;
       }
       
       location /static/ {
           alias /home/pdfviewer/app/frontend/;
           expires 30d;
           add_header Cache-Control "public, no-transform";
       }
   }
   EOF
   
   # Enable site
   sudo ln -s /etc/nginx/sites-available/pdfviewer /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl restart nginx
   ```

8. **SSL Configuration (Let's Encrypt)**
   ```bash
   # Install certbot
   sudo apt install certbot python3-certbot-nginx -y
   
   # Get SSL certificate
   sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
   
   # Test auto-renewal
   sudo certbot renew --dry-run
   ```

## Docker Deployment

### Dockerfile
```dockerfile
# Create Dockerfile in project root
FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Copy backend requirements and install Python dependencies
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY backend/ ./backend/
COPY frontend/ ./frontend/
COPY run.py .

# Create upload directories
RUN mkdir -p backend/uploads/{opord,warno,intel}

# Set environment variables
ENV PYTHONPATH=/app/backend
ENV DATABASE_URL=sqlite:///./documents.db

# Expose port
EXPOSE 8000

# Run application
CMD ["python", "run.py"]
```

### Docker Compose
```yaml
# docker-compose.yml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "8000:8000"
    volumes:
      - ./backend/uploads:/app/backend/uploads
      - ./backend/documents.db:/app/backend/documents.db
    environment:
      - DATABASE_URL=sqlite:///./documents.db
      - SECRET_KEY=your-secret-key-here
      - UPLOAD_MAX_SIZE=52428800
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - app
    restart: unless-stopped
```

### Build and Run
```bash
# Build image
docker build -t military-pdf-viewer .

# Run with docker-compose
docker-compose up -d

# View logs
docker-compose logs -f app
```

## Cloud Deployment

### AWS Deployment

1. **EC2 Instance Setup**
   ```bash
   # Launch EC2 instance (t3.medium or larger)
   # Configure security groups (HTTP/HTTPS/SSH)
   # Attach EBS volume for document storage
   ```

2. **RDS Database (Optional)**
   ```bash
   # Create PostgreSQL RDS instance
   # Update DATABASE_URL in environment
   DATABASE_URL=postgresql://user:pass@rds-endpoint:5432/dbname
   ```

3. **S3 Storage (Optional)**
   ```bash
   # Create S3 bucket for document storage
   # Install boto3 and configure AWS credentials
   pip install boto3
   ```

### Azure Deployment

1. **Azure App Service**
   ```bash
   # Create App Service plan
   az appservice plan create --name pdfviewer-plan --resource-group myResourceGroup --sku P1V2

   # Create web app
   az webapp create --resource-group myResourceGroup --plan pdfviewer-plan --name pdfviewer-app --runtime "PYTHON|3.11"
   ```

2. **Database Setup**
   ```bash
   # Create Azure Database for PostgreSQL
   az postgres server create --resource-group myResourceGroup --name pdfviewer-db --admin-user dbadmin --admin-password SecurePass123
   ```

### Google Cloud Platform

1. **Cloud Run Deployment**
   ```bash
   # Build and push to Container Registry
   gcloud builds submit --tag gcr.io/PROJECT-ID/pdfviewer

   # Deploy to Cloud Run
   gcloud run deploy --image gcr.io/PROJECT-ID/pdfviewer --platform managed
   ```

## Security Considerations

### Application Security

1. **Environment Variables**
   ```bash
   # Use strong secret keys
   SECRET_KEY=$(openssl rand -hex 32)
   
   # Secure database connections
   DATABASE_URL=postgresql://user:pass@localhost:5432/db?sslmode=require
   ```

2. **File Upload Security**
   ```python
   # Configure in backend/config.py
   UPLOAD_MAX_SIZE = 52428800  # 50MB
   ALLOWED_EXTENSIONS = ["pdf"]
   ```

3. **CORS Configuration**
   ```python
   # Restrict CORS origins
   CORS_ORIGINS = ["https://yourdomain.com"]
   ```

### Infrastructure Security

1. **Firewall Configuration**
   ```bash
   # UFW firewall rules
   sudo ufw allow ssh
   sudo ufw allow 'Nginx Full'
   sudo ufw enable
   ```

2. **SSL/TLS Configuration**
   ```nginx
   # Nginx SSL configuration
   ssl_protocols TLSv1.2 TLSv1.3;
   ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384;
   ssl_prefer_server_ciphers off;
   add_header Strict-Transport-Security "max-age=63072000" always;
   ```

3. **Regular Updates**
   ```bash
   # Automated security updates
   sudo apt install unattended-upgrades
   sudo dpkg-reconfigure -plow unattended-upgrades
   ```

## Monitoring and Maintenance

### Log Management

1. **Application Logs**
   ```bash
   # Configure log rotation
   sudo cat > /etc/logrotate.d/pdfviewer << EOF
   /home/pdfviewer/app/logs/*.log {
       daily
       missingok
       rotate 30
       compress
       delaycompress
       notifempty
       create 644 pdfviewer www-data
   }
   EOF
   ```

2. **System Monitoring**
   ```bash
   # Install monitoring tools
   sudo apt install htop iotop nethogs -y
   
   # Setup log monitoring
   tail -f /home/pdfviewer/app/logs/error.log
   ```

### Backup Strategy

1. **Database Backup**
   ```bash
   # SQLite backup
   sqlite3 /home/pdfviewer/app/backend/production.db ".backup /backups/db-$(date +%Y%m%d).db"
   
   # PostgreSQL backup
   pg_dump dbname > /backups/db-$(date +%Y%m%d).sql
   ```

2. **Document Backup**
   ```bash
   # Rsync backup
   rsync -av /home/pdfviewer/app/backend/uploads/ /backups/uploads/
   
   # S3 sync (if using S3)
   aws s3 sync /home/pdfviewer/app/backend/uploads/ s3://your-backup-bucket/
   ```

3. **Automated Backups**
   ```bash
   # Create backup script
   cat > /home/pdfviewer/backup.sh << EOF
   #!/bin/bash
   DATE=$(date +%Y%m%d)
   sqlite3 /home/pdfviewer/app/backend/production.db ".backup /backups/db-$DATE.db"
   rsync -av /home/pdfviewer/app/backend/uploads/ /backups/uploads/
   find /backups -name "*.db" -mtime +30 -delete
   EOF
   
   chmod +x /home/pdfviewer/backup.sh
   
   # Add to crontab
   (crontab -l 2>/dev/null; echo "0 2 * * * /home/pdfviewer/backup.sh") | crontab -
   ```

### Performance Monitoring

1. **Application Metrics**
   ```python
   # Add to requirements.txt
   prometheus-client==0.17.1
   
   # Monitor endpoint response times
   # Track upload success rates
   # Monitor database queries
   ```

2. **System Metrics**
   ```bash
   # Install system monitoring
   sudo apt install prometheus-node-exporter -y
   
   # Monitor disk usage
   df -h
   
   # Monitor memory usage
   free -h
   ```

### Troubleshooting

1. **Common Issues**
   ```bash
   # Check application status
   sudo supervisorctl status pdfviewer
   
   # Check logs
   tail -f /home/pdfviewer/app/logs/error.log
   
   # Check disk space
   df -h
   
   # Check memory usage
   free -h
   ```

2. **Recovery Procedures**
   ```bash
   # Restart application
   sudo supervisorctl restart pdfviewer
   
   # Restart nginx
   sudo systemctl restart nginx
   
   # Restore from backup
   sqlite3 production.db ".restore /backups/db-20231201.db"
   ```

This deployment guide provides comprehensive instructions for various deployment scenarios. Choose the approach that best fits your infrastructure requirements and security needs.