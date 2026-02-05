-- Add optional comment column to lab operation logs for free-text notes (e.g. rejection reason).
-- Safe to run multiple times (IF NOT EXISTS / add only if missing).

ALTER TABLE lab_operation_logs
ADD COLUMN IF NOT EXISTS comment VARCHAR(2000) NULL;

COMMENT ON COLUMN lab_operation_logs.comment IS 'Optional free-text note for this operation (e.g. rejection reason, validation notes)';
