-- Migration: Add Foreign Key Constraint on OrderTest.sampleId
-- Purpose: Enforce referential integrity between order_tests and samples
-- Prevents orphaned sample references

-- First, check for any orphaned records and clean them up
-- (This query helps identify issues before adding the constraint)
-- SELECT ot.id, ot.sample_id
-- FROM order_tests ot
-- LEFT JOIN samples s ON ot.sample_id = s.sample_id
-- WHERE ot.sample_id IS NOT NULL AND s.sample_id IS NULL;

-- Add the foreign key constraint
-- Using SET NULL on delete to preserve test records if a sample is deleted
ALTER TABLE order_tests
DROP CONSTRAINT IF EXISTS fk_order_test_sample;

ALTER TABLE order_tests
ADD CONSTRAINT fk_order_test_sample
FOREIGN KEY (sample_id)
REFERENCES samples(sample_id)
ON DELETE SET NULL
ON UPDATE CASCADE;

-- Add an index on sample_id for better join performance
CREATE INDEX IF NOT EXISTS idx_order_tests_sample_id
ON order_tests(sample_id)
WHERE sample_id IS NOT NULL;

-- Add comment for documentation
COMMENT ON CONSTRAINT fk_order_test_sample ON order_tests IS
'Links order tests to their source sample/specimen. SET NULL on delete preserves test records for audit purposes.';
