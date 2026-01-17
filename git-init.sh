#!/bin/bash

# Initialize git repository and commit backend implementation
cd /Users/psiyou/Desktop/Atlas

echo "Initializing git repository..."
git init

echo "Adding files to git..."
git add .

echo "Creating initial commit with backend implementation..."
git commit -m "feat: Initial backend implementation with FastAPI

- Complete database models (User, Patient, Test, Order, Sample, Aliquot, Billing, Report)
- JWT authentication with role-based access control
- 40+ REST API endpoints
- Automatic sample generation on order creation
- Result entry and validation workflows
- ID generation service (PAT-YYYYMMDD-XXX pattern)
- Database initialization script
- Comprehensive API documentation"

echo "Creating new branch for frontend cleanup..."
git checkout -b feature/remove-localstorage

echo "✅ Git repository initialized!"
echo "✅ Backend committed to main branch"
echo "✅ Switched to 'feature/remove-localstorage' branch for frontend cleanup"

