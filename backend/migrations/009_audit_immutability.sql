-- 009_audit_immutability.sql
-- Makes audit tables append-only via PostgreSQL rules and privileges.
-- Run as a superuser (or the migration runner role) once.

-- NOTE: PostgreSQL RULES are session-level immutability guards.
-- For stricter enforcement, also revoke DELETE/UPDATE from the app DB role:
--   REVOKE DELETE, UPDATE ON audit_logs FROM fact_user;
--   REVOKE DELETE, UPDATE ON fcra_audit_logs FROM fact_user;
-- (Run manually — not automated here since the migration runner may be the same role.)

BEGIN;

-- ─── 1. Prevent UPDATE on audit_logs ─────────────────────────────────────────
CREATE OR REPLACE RULE audit_logs_no_update AS
  ON UPDATE TO audit_logs DO INSTEAD NOTHING;

-- ─── 2. Prevent DELETE on audit_logs ─────────────────────────────────────────
CREATE OR REPLACE RULE audit_logs_no_delete AS
  ON DELETE TO audit_logs DO INSTEAD NOTHING;

-- ─── 3. Prevent UPDATE on fcra_audit_logs ────────────────────────────────────
CREATE OR REPLACE RULE fcra_audit_logs_no_update AS
  ON UPDATE TO fcra_audit_logs DO INSTEAD NOTHING;

-- ─── 4. Prevent DELETE on fcra_audit_logs ────────────────────────────────────
CREATE OR REPLACE RULE fcra_audit_logs_no_delete AS
  ON DELETE TO fcra_audit_logs DO INSTEAD NOTHING;

-- ─── 5. Add integrity hash column to audit_logs (if not exists) ───────────────
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
