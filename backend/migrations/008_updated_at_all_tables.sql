-- Migration: Add updated_at to all tables and enforce via DB triggers
-- Description: Ensures updated_at is set on every UPDATE, regardless of source (ORM, raw SQL, cascading).
-- Date: 2026-02-16
-- Run after: 007_fill_payments_columns.sql

-- =============================================================================
-- 1. Add updated_at (and created_at where missing) to tables that lack them
-- =============================================================================

-- users
ALTER TABLE users
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL;
UPDATE users SET updated_at = created_at WHERE updated_at IS NULL;

-- reports
ALTER TABLE reports
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL;
UPDATE reports SET updated_at = created_at WHERE updated_at IS NULL;

-- aliquots
ALTER TABLE aliquots
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL;
UPDATE aliquots SET updated_at = created_at WHERE updated_at IS NULL;

-- invoices (has created_at in model; ensure updated_at exists)
ALTER TABLE invoices
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL;
UPDATE invoices SET updated_at = created_at WHERE updated_at IS NULL;

-- payments (may lack created_at/updated_at)
ALTER TABLE payments
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE payments
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
UPDATE payments SET created_at = paid_at WHERE created_at IS NULL;
UPDATE payments SET updated_at = paid_at WHERE updated_at IS NULL;
ALTER TABLE payments ALTER COLUMN created_at SET NOT NULL;
ALTER TABLE payments ALTER COLUMN updated_at SET NOT NULL;

-- insurance_claims
ALTER TABLE insurance_claims
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE insurance_claims
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
UPDATE insurance_claims SET created_at = submitted_date WHERE created_at IS NULL;
UPDATE insurance_claims SET updated_at = submitted_date WHERE updated_at IS NULL;
ALTER TABLE insurance_claims ALTER COLUMN created_at SET NOT NULL;
ALTER TABLE insurance_claims ALTER COLUMN updated_at SET NOT NULL;

-- lab_operation_logs
ALTER TABLE lab_operation_logs
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL;
UPDATE lab_operation_logs SET updated_at = created_at WHERE updated_at IS NULL;

-- =============================================================================
-- 2. Generic trigger function: set NEW.updated_at on any UPDATE
-- =============================================================================

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- 3. Drop order_tests-specific trigger (replace with generic)
-- =============================================================================

DROP TRIGGER IF EXISTS order_test_updated_at_trigger ON order_tests;
DROP FUNCTION IF EXISTS update_order_test_updated_at();

-- =============================================================================
-- 4. Attach BEFORE UPDATE trigger to every table with updated_at
-- =============================================================================

DO $$
DECLARE
    t text;
    tables text[] := ARRAY[
        'orders', 'order_tests', 'affiliation_pricing', 'patients', 'samples', 'tests',
        'users', 'reports', 'aliquots', 'invoices', 'payments', 'insurance_claims', 'lab_operation_logs'
    ];
BEGIN
    FOREACH t IN ARRAY tables
    LOOP
        EXECUTE format(
            'DROP TRIGGER IF EXISTS trg_%s_updated_at ON %I; CREATE TRIGGER trg_%s_updated_at BEFORE UPDATE ON %I FOR EACH ROW EXECUTE PROCEDURE set_updated_at();',
            t, t, t, t
        );
    END LOOP;
END $$;
