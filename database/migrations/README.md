# Migrations — Legacy Location

> **Do not apply files from this directory directly.**
>
> The canonical migration directory is **`backend/migrations/`** and the
> runner is **`backend/scripts/migrate.js`**.
>
> ```bash
> cd backend
> node scripts/migrate.js          # apply pending
> node scripts/migrate.js --status # show status
> ```

## Files here (reference only)

| File | Status |
|---|---|
| `002_ap_enhancements.sql` | Copied to `backend/migrations/002_ap_enhancements.sql` |
| `fcra_001_initial.sql` | Superseded by `backend/migrations/fcra_001_initial.sql` (contains DO-block hardening) |
