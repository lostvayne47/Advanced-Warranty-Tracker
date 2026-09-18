# Supabase setup for Warranty Tracker

The integration is implemented and tested against local PostgreSQL plus a
Storage API test double. A hosted project has not yet been created or connected.

## 1. Create and configure a project

Create a project in the [Supabase dashboard](https://supabase.com/dashboard).
Keep its database password in your password manager.

From the project's **Connect** dialog, copy the **Session pooler** host, port
and username. Use port 5432 and the exact project-specific username shown.
The direct connection is also suitable when your network supports it.
Do not use transaction pooling for these migrations.
See [Supabase's Spring Boot guide](https://supabase.com/docs/guides/getting-started/quickstarts/spring-boot).

Copy the project API URL and the legacy **service_role** API key from the
project's API settings. The browser uses this application's JWT and API, so
neither the service-role key nor the database password belongs in React.
Keep the `invoices` bucket private and do not add browser Storage policies.

## 2. Set backend environment variables

Run this in PowerShell from `Backend`. Replace only the non-secret placeholders;
the commands prompt for secrets without echoing them:

```powershell
$env:SUPABASE_URL = "https://YOUR_PROJECT_REF.supabase.co"
$env:SUPABASE_DB_URL = "jdbc:postgresql://YOUR_SESSION_POOLER_HOST:5432/postgres?sslmode=require"
$env:SUPABASE_DB_USERNAME = "postgres.YOUR_PROJECT_REF"

$dbSecret = Read-Host "Supabase database password" -AsSecureString
$env:SUPABASE_DB_PASSWORD = [System.Net.NetworkCredential]::new("", $dbSecret).Password
$storageSecret = Read-Host "Supabase service_role key" -AsSecureString
$env:SUPABASE_SERVICE_ROLE_KEY = [System.Net.NetworkCredential]::new("", $storageSecret).Password

$jwtBytes = New-Object byte[] 48
$jwtRng = [System.Security.Cryptography.RandomNumberGenerator]::Create()
$jwtRng.GetBytes($jwtBytes)
$jwtRng.Dispose()
$env:JWT_SECRET = [Convert]::ToBase64String($jwtBytes)
$env:CORS_ORIGINS = "http://localhost:5173"

.\mvnw.cmd spring-boot:run "-Dspring-boot.run.profiles=supabase"
```

Use the same JWT secret across restarts if existing sessions should remain valid.
Store environment settings in your host's secret manager for deployment.
`Backend/.env.example` is a reference; Spring does not automatically read `.env`.

## 3. Migrations and startup verification

On first startup, Flyway applies:

1. `db/migration/V1__initial_schema.sql`: application tables and indexes.
2. `db/migration/V2__invoice_cleanup.sql`: durable cleanup queue and unique receipt index.
3. `db/supabase/V3__private_supabase_access.sql`: private invoices bucket,
   10 MB upload limit, MIME restrictions, RLS on app tables, and removal of
   direct `anon`/`authenticated` table privileges.

Migration history lives in the dedicated `warranty_migrations` schema so the
pre-existing Supabase schemas do not interfere. The backend then validates its
entity mappings and verifies via Storage HTTP API that `invoices` is private.
Use the project database owner for this initial migration run.

These instructions assume a new project with no Warranty Tracker tables.
If you manually applied the old `Database/schema.sql`, stop and reconcile
that schema with V1 before explicitly baselining Flyway at version 1.
Automatic baselining is intentionally disabled; do not delete existing data
or use `ddl-auto=create` to fix a migration error.
Do not edit already-applied migrations; add a new version.

Optional SQL checks in the Supabase SQL editor:

```sql
SELECT version, description, success
FROM warranty_migrations.flyway_schema_history ORDER BY installed_rank;

SELECT id, public, file_size_limit, allowed_mime_types
FROM storage.buckets WHERE id = 'invoices';

SELECT relname, relrowsecurity
FROM pg_class
WHERE oid IN ('public.app_user'::regclass, 'public.warranty'::regclass,
              'public.warranty_attachment'::regclass);
```

All migrations should succeed, the bucket should have `public = false`, and
the listed tables should have RLS enabled. Backend JDBC access uses the owner;
browser roles cannot read application tables directly.

## 4. Connect the frontend and verify receipts

Set `VITE_API_URL=http://localhost:5000/api` in `Frontend/.env`, restart Vite,
and sign out of any prior demo session. Create a real account.

- Add a warranty with a JPEG, PNG, or still WebP invoice under 10 MB.
  Enter details manually; OCR is a later milestone.
- Use `GET /api/warranties/{id}` with the returned bearer token to check
  `fileName` and `invoiceImageUrl`. Open the signed URL to view the stored image.
  The URL expires after five minutes; fetch the warranty again to refresh it.
- Verify the row in `warranty_attachment` and the object under
  `{userId}/{warrantyId}/{randomId}.{extension}` in the private bucket.
- Edit with a replacement invoice. The old object should be removed by the
  cleanup worker, normally within a minute; editing without a file keeps it.
- Delete through `DELETE /api/warranties/{id}`. Metadata is removed immediately;
  file deletion is queued. The frontend delete button is milestone 3.
- With a second account, the first account's warranty must return 404 and
  must not appear in the second account's list.

Uploaded images are decoded and re-encoded; WebP becomes PNG. This preserves
pixels but does not archive the original file/metadata. Signed links are bearer
links: anyone holding one can use it until expiry or object removal.
Read more about [private downloads](https://supabase.com/docs/guides/storage/serving/downloads).

## Cleanup and troubleshooting

The worker persists retries in `public.storage_cleanup_task`. Upload intents
are eligible after one hour to recover abandoned uploads; replacement/deletion
jobs are eligible immediately after their database transaction commits.
While a save holds the intent row lock, cleanup cannot delete that upload.
The worker retains objects referenced by committed attachment rows.

Storage failures return a generic 503. Confirm the project URL, server-only
service-role key, bucket configuration and connectivity. Logs do not include
upstream response bodies or signed URLs. If deletions repeatedly fail, tasks
remain queued with increasing `attempts` and retry delays up to one hour.
Inspect queue counts/attempts and repair storage access; do not clear the queue.
Keep the backend running for scheduled cleanup.

Use `.\mvnw.cmd verify` for automated tests before live verification. They
download isolated PostgreSQL test binaries and do not use your hosted credentials.
Hosted upload, signed-download, and cleanup verification remains pending until
these setup steps are completed.
