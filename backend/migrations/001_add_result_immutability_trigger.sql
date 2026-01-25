-- Migration: Add Result Immutability Trigger
-- Purpose: Prevent modification of validated results at the database level
-- This provides defense-in-depth beyond application-level controls

-- Create the trigger function
CREATE OR REPLACE FUNCTION prevent_validated_result_update()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if trying to modify a validated result
    IF OLD.status = 'VALIDATED' AND (
        (NEW.results::text IS DISTINCT FROM OLD.results::text) OR
        (NEW.status IS DISTINCT FROM OLD.status)
    ) THEN
        RAISE EXCEPTION 'Cannot modify validated results. Create an amended report instead.';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger on order_tests table
DROP TRIGGER IF EXISTS enforce_result_immutability ON order_tests;
CREATE TRIGGER enforce_result_immutability
BEFORE UPDATE ON order_tests
FOR EACH ROW
EXECUTE FUNCTION prevent_validated_result_update();

-- Add comment for documentation
COMMENT ON TRIGGER enforce_result_immutability ON order_tests IS
'Prevents modification of results or status once a test is validated. Required for regulatory compliance (ISO 15189, CAP, CLIA).';
