# Database Migration Scripts

This directory contains SQL migration scripts for the PrepUp database.

## Running Migrations

### Local Development (D1)

To run migrations on your local D1 database:

```bash
# Apply a specific migration
npx wrangler d1 execute DB --local --file=./scripts/add-is-active-column.sql

# Or run against production (remove --local flag)
npx wrangler d1 execute DB --file=./scripts/add-is-active-column.sql
```

### Available Migrations

1. **add-is-active-column.sql** - Adds the `is_active` column to the resumes table for soft delete functionality
   - Adds `is_active INTEGER NOT NULL DEFAULT 1` column
   - Creates index on the column for better query performance
   - Safe to run multiple times (uses IF NOT EXISTS for index)

## Migration Checklist

When adding a new migration:

1. Create the SQL file in this directory
2. Document it in this README
3. Test locally with `--local` flag first
4. Apply to production after testing
5. Update any related TypeScript types if needed

