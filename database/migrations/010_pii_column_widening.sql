-- 010_pii_column_widening.sql
-- Widen PII columns to TEXT so they can hold AES-256-GCM encrypted values.
-- Encrypted values use format: v1:<b64-iv>:<b64-ciphertext>:<b64-authtag> (~100-160 chars)

BEGIN;

ALTER TABLE fcra_bank_accounts  ALTER COLUMN account_number       TYPE TEXT;
ALTER TABLE fcra_donors         ALTER COLUMN pan_number           TYPE TEXT;
ALTER TABLE fcra_donors         ALTER COLUMN passport_number      TYPE TEXT;
ALTER TABLE fcra_registrations  ALTER COLUMN pan_number           TYPE TEXT;
ALTER TABLE accounts            ALTER COLUMN bank_account_number  TYPE TEXT;

-- Also widen mfa_secret column to be safe (it stores base32 + encrypted versions)
ALTER TABLE users ALTER COLUMN mfa_secret TYPE TEXT;

COMMIT;
