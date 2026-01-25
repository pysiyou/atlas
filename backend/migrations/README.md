# Database Migrations

This directory contains SQL migration scripts for the Atlas LIS system.
These scripts should be applied to the database in order to enable regulatory compliance features.

## Migration Order

Apply these migrations in numerical order:

1. `001_add_result_immutability_trigger.sql` - Prevents modification of validated results
2. `002_make_audit_log_immutable.sql` - Makes audit log append-only (HIPAA compliance)
3. `003_add_sample_fk_constraint.sql` - Adds foreign key constraint on OrderTest.sampleId

## How to Apply

### Using psql (PostgreSQL)

```bash
# Connect to your database
psql -h localhost -U your_user -d atlas_db

# Apply each migration
\i /path/to/migrations/001_add_result_immutability_trigger.sql
\i /path/to/migrations/002_make_audit_log_immutable.sql
\i /path/to/migrations/003_add_sample_fk_constraint.sql
```

### Using a Migration Tool

If using Alembic or another migration tool, you can wrap these SQL scripts in your migration framework.

## Rollback

### 001 - Result Immutability Trigger

```sql
DROP TRIGGER IF EXISTS enforce_result_immutability ON order_tests;
DROP FUNCTION IF EXISTS prevent_validated_result_update();
```

### 002 - Audit Log Immutability

```sql
DROP RULE IF EXISTS prevent_audit_delete ON lab_operation_logs;
DROP RULE IF EXISTS prevent_audit_update ON lab_operation_logs;
```

### 003 - Sample FK Constraint

```sql
ALTER TABLE order_tests DROP CONSTRAINT IF EXISTS fk_order_test_sample;
DROP INDEX IF EXISTS idx_order_tests_sample_id;
```

## Testing

After applying migrations, verify:

1. **Result Immutability**: Try to UPDATE a row in order_tests where status='validated'. It should fail.
2. **Audit Log Immutability**: Try to DELETE from lab_operation_logs. It should silently fail.
3. **FK Constraint**: Try to INSERT into order_tests with a non-existent sample_id. It should fail.

## Notes

- These migrations are designed for PostgreSQL
- Always backup your database before applying migrations
- Test migrations in a staging environment first
