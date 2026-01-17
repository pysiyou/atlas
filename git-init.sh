#!/bin/bash

# Initialize git repository and commit backend implementation
cd /Users/psiyou/Desktop/Atlas

echo "Initializing git repository..."
git init

echo "Adding files to git..."
git add .

echo "Creating initial commit..."
git commit -m "feat: Initial backend implementation with FastAPI

- Complete database models (User, Patient, Test, Order, Sample, Aliquot, Billing, Report)
- JWT authentication with role-based access control
- 40+ REST API endpoints
- Automatic sample generation on order creation
- Result entry and validation workflows
- ID generation service (PAT-YYYYMMDD-XXX pattern)
- Database initialization script
- Comprehensive API documentation"

echo "✅ Git repository initialized and committed!"
