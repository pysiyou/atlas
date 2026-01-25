-- Migration: Make Audit Log Append-Only
-- Purpose: Prevent deletion or modification of audit records for HIPAA compliance
-- Audit trails must be immutable to meet regulatory requirements

-- Create rule to prevent DELETE operations
CREATE OR REPLACE RULE prevent_audit_delete AS
ON DELETE TO lab_operation_logs
DO INSTEAD NOTHING;

-- Create rule to prevent UPDATE operations
CREATE OR REPLACE RULE prevent_audit_update AS
ON UPDATE TO lab_operation_logs
DO INSTEAD NOTHING;

-- Add comments for documentation
COMMENT ON RULE prevent_audit_delete ON lab_operation_logs IS
'Prevents deletion of audit records. Required for HIPAA compliance - audit trails must be immutable.';

COMMENT ON RULE prevent_audit_update ON lab_operation_logs IS
'Prevents modification of audit records. Required for HIPAA compliance - audit trails must be immutable.';

-- Note: To allow administrative corrections (rare cases), these rules would need to be
-- temporarily disabled by a DBA with appropriate authorization and logging.
