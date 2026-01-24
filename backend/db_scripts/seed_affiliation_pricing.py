"""
Seed Affiliation Pricing Data
Creates default pricing for 6, 12, and 24 month affiliation plans
"""
from app.models.affiliation_pricing import AffiliationPricing
from app.schemas.enums import AffiliationDuration


def seed_affiliation_pricing(db):
    """
    Seed initial affiliation pricing data.
    
    Pricing strategy:
    - 6 months: $29.99 (base rate)
    - 12 months: $49.99 (best value - ~17% discount vs 6mo)
    - 24 months: $89.99 (best long-term value - ~25% discount vs 12mo)
    """
    print("📊 Seeding affiliation pricing...")
    
    # Check if pricing already exists
    existing = db.query(AffiliationPricing).first()
    if existing:
        print("✓ Affiliation pricing already exists, skipping seed")
        return
    
    # Create pricing entries
    pricing_data = [
        {
            "duration": AffiliationDuration.SIX_MONTHS,
            "price": 29.99,
            "isActive": True,
        },
        {
            "duration": AffiliationDuration.TWELVE_MONTHS,
            "price": 49.99,
            "isActive": True,
        },
        {
            "duration": AffiliationDuration.TWENTY_FOUR_MONTHS,
            "price": 89.99,
            "isActive": True,
        },
    ]
    
    for data in pricing_data:
        pricing = AffiliationPricing(**data)
        db.add(pricing)
    
    db.commit()
    print(f"✓ Created {len(pricing_data)} affiliation pricing entries")
