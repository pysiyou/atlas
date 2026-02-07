-- Fill all payments columns: backfill NULLs and set defaults for future inserts
-- Run after 006_add_lab_operation_log_comment.sql

-- Backfill receipt_generated (nullable in DB but should be false when missing)
UPDATE payments SET receipt_generated = false WHERE receipt_generated IS NULL;

-- Set default so new rows always have receipt_generated
ALTER TABLE payments ALTER COLUMN receipt_generated SET DEFAULT false;

-- Backfill notes so column is never null (empty string)
UPDATE payments SET notes = '' WHERE notes IS NULL;

-- Optional: set default for notes so new inserts get '' when not specified
ALTER TABLE payments ALTER COLUMN notes SET DEFAULT '';
