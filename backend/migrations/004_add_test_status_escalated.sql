-- Migration: Add 'escalated' to TestStatus enum for order_tests.status
-- Purpose: Allow tests to be marked as escalated for supervisor review (preparation only; workflow TBD)
-- Run after app/schemas/enums.py TestStatus.ESCALATED is added.

-- PostgreSQL: SQLAlchemy creates enum type from Python enum class name (lowercase) -> "teststatus"
-- Add new value; IF NOT EXISTS available in PostgreSQL 9.5+
ALTER TYPE teststatus ADD VALUE IF NOT EXISTS 'escalated';
