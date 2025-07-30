#!/bin/bash

# Military PDF Viewer Setup Script
echo "🎯 Military PDF Viewer Setup"
echo "=========================="

# Check Python version
python_version=$(python3 --version 2>&1)
if [[ $? -eq 0 ]]; then
    echo "✅ Python detected: $python_version"
else
    echo "❌ Python 3 is required but not found"
    exit 1
fi

# Create virtual environment
echo "📦 Creating virtual environment..."
cd backend
if [ ! -d "venv" ]; then
    python3 -m venv venv
    echo "✅ Virtual environment created"
else
    echo "✅ Virtual environment already exists"
fi

# Activate virtual environment
echo "🔧 Activating virtual environment..."
source venv/bin/activate || { echo "❌ Failed to activate virtual environment"; exit 1; }

# Install dependencies
echo "📥 Installing dependencies..."
pip install --upgrade pip
pip install -r requirements.txt

if [[ $? -eq 0 ]]; then
    echo "✅ Dependencies installed successfully"
else
    echo "❌ Failed to install dependencies"
    exit 1
fi

# Create environment file if it doesn't exist
if [ ! -f ".env" ]; then
    echo "⚙️ Creating environment configuration..."
    cp .env.example .env
    
    # Generate a secure random secret key
    if command -v openssl &> /dev/null; then
        SECRET_KEY=$(openssl rand -hex 32)
        sed -i "s/your-secret-key-here/$SECRET_KEY/" .env
        echo "✅ Environment file created with secure secret key"
    else
        echo "⚠️ Environment file created with default secret key (change in production)"
    fi
else
    echo "✅ Environment file already exists"
fi

# Initialize database
echo "🗄️ Initializing database..."
cd ..
source backend/venv/bin/activate
cd backend
python -c "from app.database.connection import create_tables; create_tables()"
cd ..

if [[ $? -eq 0 ]]; then
    echo "✅ Database initialized successfully"
else
    echo "❌ Failed to initialize database"
    exit 1
fi

# Check if uploads directories exist
echo "📁 Checking upload directories..."
for category in opord warno intel; do
    if [ -d "backend/uploads/$category" ]; then
        echo "✅ Upload directory exists: $category"
    else
        mkdir -p "backend/uploads/$category"
        echo "✅ Created upload directory: $category"
    fi
done

# Make the run script executable
chmod +x run.py

echo ""
echo "🎉 Setup completed successfully!"
echo ""
echo "📋 Next steps:"
echo "1. Review the configuration in backend/.env"
echo "2. Start the application: python run.py"
echo "3. Open your browser to: http://localhost:8000"
echo ""
echo "📚 Documentation:"
echo "- README.md - General overview and usage"
echo "- docs/API.md - API documentation"
echo "- docs/DEPLOYMENT.md - Deployment guide"
echo ""
echo "🔧 Troubleshooting:"
echo "- Check logs in backend/logs/ if created"
echo "- Ensure port 8000 is available"
echo "- Run 'python -c \"import sys; print(sys.path)\"' to debug import issues"
echo ""
echo "Ready to deploy! 🚀"