"""
Recreate database tables with new camelCase column names
"""
import sys
import importlib

# Clear any cached modules
modules_to_clear = [k for k in sys.modules.keys() if k.startswith('app.')]
for mod in modules_to_clear:
    del sys.modules[mod]

# Now import fresh
from app.database import Base, engine
from app.models.patient import Patient

# Verify the model has camelCase columns
print("📋 Patient model columns:")
for col in Patient.__table__.columns:
    print(f"   - {col.name}")

print("\n🗑️  Dropping all tables...")
Base.metadata.drop_all(bind=engine)

print("✅ Creating tables with camelCase columns...")
Base.metadata.create_all(bind=engine)

print("✅ Database recreated successfully!")
print("\nNow run: poetry run python seed_data.py")
