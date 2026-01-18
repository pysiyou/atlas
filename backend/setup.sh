#!/bin/bash

# Setup script for Atlas backend with PostgreSQL

echo "🚀 Setting up Atlas Backend..."

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed."
    echo "Please install Docker Desktop from: https://www.docker.com/products/docker-desktop"
    exit 1
fi

# Start PostgreSQL using docker compose (new syntax)
echo "📦 Starting PostgreSQL container..."
docker compose up -d

# Wait for PostgreSQL to be ready
echo "⏳ Waiting for PostgreSQL to be ready..."
sleep 5

# Check if container is running
if docker ps | grep -q atlas_postgres; then
    echo "✅ PostgreSQL is running"
else
    echo "❌ Failed to start PostgreSQL"
    exit 1
fi

# Install Python dependencies
echo "📚 Installing Python dependencies..."
poetry install

# Initialize database
echo "🗄️  Initializing database..."
poetry run python init_db.py



echo ""
echo "✅ Setup complete!"
echo ""
echo "To start the backend server:"
echo "  poetry run uvicorn app.main:app --reload"
echo ""
echo "To stop PostgreSQL:"
echo "  docker compose down"
