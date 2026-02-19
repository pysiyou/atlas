#!/bin/bash

# Setup script for Atlas backend with local PostgreSQL

echo "🚀 Setting up Atlas Backend..."

# Check that PostgreSQL is reachable (optional; requires psql or pg_isready)
if command -v pg_isready &> /dev/null; then
    if ! pg_isready -h localhost -p 5432 -q 2>/dev/null; then
        echo "⚠️  PostgreSQL does not appear to be running on localhost:5432."
        echo "   Start PostgreSQL and ensure database atlas_lab and user atlas exist (see README)."
        read -p "   Continue anyway? [y/N] " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    else
        echo "✅ PostgreSQL is reachable"
    fi
else
    echo "ℹ️  Install PostgreSQL locally and create database (see README)."
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
