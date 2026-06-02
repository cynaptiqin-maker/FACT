-- 009_audit_immutability.sql
-- Makes audit tables append-only via PostgreSQL triggers that abort transactions.
-- Run as a superuser (or the migration runner role) once.

BEGIN;

-- Replace RULES with trigger functions that raise exceptions
-- Rules with DO INSTEAD NOTHING are silent; triggers make bypass attempts visible and abort transactions

CREATE OR REPLACE FUNCTION enforce_audit_immutable()
RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'audit log is append-only: % on % is not permitted', TG_OP, TG_TABLE_NAME
    USING ERRCODE = 'insufficient_privilege';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS audit_logs_no_update ON audit_logs;
CREATE TRIGGER audit_logs_no_update
  BEFORE UPDATE ON audit_logs
  FOR EACH ROW EXECUTE FUNCTION enforce_audit_immutable();

DROP TRIGGER IF EXISTS audit_logs_no_delete ON audit_logs;
CREATE TRIGGER audit_logs_no_delete
  BEFORE DELETE ON audit_logs
  FOR EACH ROW EXECUTE FUNCTION enforce_audit_immutable();

DROP TRIGGER IF EXISTS fcra_audit_logs_no_update ON fcra_audit_logs;
CREATE TRIGGER fcra_audit_logs_no_update
  BEFORE UPDATE ON fcra_audit_logs
  FOR EACH ROW EXECUTE FUNCTION enforce_audit_immutable();

DROP TRIGGER IF EXISTS fcra_audit_logs_no_delete ON fcra_audit_logs;
CREATE TRIGGER fcra_audit_logs_no_delete
  BEFORE DELETE ON fcra_audit_logs
  FOR EACH ROW EXECUTE FUNCTION enforce_audit_immutable();

-- NOTE: To also enforce at the privilege layer (belt-and-suspenders), run manually as superuser:
--   REVOKE DELETE, UPDATE ON audit_logs FROM fact_user;
--   REVOKE DELETE, UPDATE ON fcra_audit_logs FROM fact_user;
-- This is not automated because the migration runner connects as fact_user (the table owner)
-- and PostgreSQL does not allow owners to revoke their own privileges.

-- ─── Add integrity hash column to audit_logs (if not exists) ──────────────────
ALTER TABLE audit_logs
  ADD COLUMN IF NOT EXISTS row_hash TEXT GENERATED ALWAYS AS (
    md5(
      COALESCE(id::text,'') ||
      COALESCE(tenant_id::text,'') ||
      COALESCE(user_id::text,'') ||
      COALESCE(action,'') ||
      COALESCE(entity_type,'') ||
      COALESCE(entity_id::text,'') ||
      created_at::text
    )
  ) STORED;

COMMIT;
