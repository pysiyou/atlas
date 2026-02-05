-- Migration: Add timestamps to order_tests table
-- Description: Adds created_at and updated_at columns to track order test lifecycle
-- Date: 2026-02-01

-- Add created_at column with default value
ALTER TABLE order_tests 
ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL;

-- Add updated_at column with default value
ALTER TABLE order_tests 
ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL;

-- Backfill created_at from parent order's created_at
UPDATE order_tests ot
SET created_at = (
    SELECT o.created_at 
    FROM orders o 
    WHERE o.order_id = ot.order_id
)
WHERE EXISTS (
    SELECT 1 FROM orders o WHERE o.order_id = ot.order_id
);

-- Backfill updated_at with best available timestamp
-- Priority: result_validated_at > result_entered_at > parent order's updated_at > created_at
UPDATE order_tests ot
SET updated_at = COALESCE(
    ot.result_validated_at,
    ot.result_entered_at,
    (SELECT o.updated_at FROM orders o WHERE o.order_id = ot.order_id),
    ot.created_at
);

-- Create trigger to automatically update updated_at on row modification
CREATE OR REPLACE FUNCTION update_order_test_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER order_test_updated_at_trigger
    BEFORE UPDATE ON order_tests
    FOR EACH ROW
    EXECUTE PROCEDURE update_order_test_updated_at();

-- Verify migration
-- Expected: All rows should have both timestamps, updated_at >= created_at
DO $$
DECLARE
    null_count INTEGER;
    invalid_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO null_count 
    FROM order_tests 
    WHERE created_at IS NULL OR updated_at IS NULL;
    
    SELECT COUNT(*) INTO invalid_count 
    FROM order_tests 
    WHERE updated_at < created_at;
    
    IF null_count > 0 THEN
        RAISE EXCEPTION 'Migration failed: % rows have NULL timestamps', null_count;
    END IF;
    
    IF invalid_count > 0 THEN
        RAISE EXCEPTION 'Migration failed: % rows have updated_at < created_at', invalid_count;
    END IF;
    
    RAISE NOTICE 'Migration successful: All order_tests have valid timestamps';
END $$;
