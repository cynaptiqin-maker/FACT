-- 011_audit_chain_hash.sql
-- Upgrades audit_logs integrity from MD5 generated column to SHA-256 chained hash via trigger.
-- Requires pgcrypto extension (CREATE EXTENSION IF NOT EXISTS pgcrypto).
--
-- Chain structure: each row's hash includes the previous row's hash for the same tenant,
-- making any gap or reorder detectable by sequential hash verification.
-- The first row in any chain uses 'GENESIS' as the prev_hash sentinel.

BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. Drop the generated column (can't be used by triggers)
ALTER TABLE audit_logs DROP COLUMN IF EXISTS row_hash;

-- 2. Add regular column (populated by trigger below)
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS row_hash TEXT;
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS prev_hash TEXT;

-- 3. Chained SHA-256 trigger function
CREATE OR REPLACE FUNCTION audit_logs_set_chain_hash()
RETURNS trigger AS $$
DECLARE
  last_hash TEXT;
BEGIN
  -- Get the most recent hash for this tenant to form the chain
  SELECT row_hash INTO last_hash
  FROM audit_logs
  WHERE tenant_id = NEW.tenant_id
  ORDER BY created_at DESC, id DESC
  LIMIT 1;

  NEW.prev_hash := COALESCE(last_hash, 'GENESIS');

  NEW.row_hash := encode(
    digest(
      COALESCE(NEW.id::text, '')         ||
      COALESCE(NEW.tenant_id::text, '')  ||
      COALESCE(NEW.user_id::text, '')    ||
      COALESCE(NEW.action, '')           ||
      COALESCE(NEW.entity_type, '')      ||
      COALESCE(NEW.entity_id::text, '')  ||
      COALESCE(NEW.created_at::text, '') ||
      NEW.prev_hash,
      'sha256'
    ),
    'hex'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Attach trigger (BEFORE INSERT so hash is part of the committed row)
DROP TRIGGER IF EXISTS audit_logs_chain_hash ON audit_logs;
CREATE TRIGGER audit_logs_chain_hash
  BEFORE INSERT ON audit_logs
  FOR EACH ROW EXECUTE FUNCTION audit_logs_set_chain_hash();

-- 5. Index for chain verification queries
CREATE INDEX IF NOT EXISTS idx_audit_logs_tenant_created
  ON audit_logs (tenant_id, created_at DESC, id DESC);

COMMIT;
