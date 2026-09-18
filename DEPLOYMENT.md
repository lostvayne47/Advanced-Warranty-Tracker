# First release deployment

The frontend is bundled into the Spring Boot JAR and uses `/api` on the same
origin. The release suite passed against the packaged app, PostgreSQL 17, and
a local Storage HTTP fixture. Hosted Supabase and deployment are still pending.
The Docker build and GitHub workflow have not been run locally (Docker is not
installed in the development environment).

## Prepare Supabase and secrets

Follow [Supabase setup](Database/SUPABASE_SETUP.md) to create a new project and
obtain its session-pooler database settings and server-only service-role key.
The first application startup applies Flyway migrations, creates the private
invoice bucket, and validates storage access. For existing application tables,
follow the migration reconciliation instructions before starting this release.

On a host with Docker and Docker Compose, copy the root `.env.example` to `.env`
and fill every placeholder. Keep this file private; it is ignored by Git and
excluded from the container build. Use single quotes around values containing
`$` or `#` so Compose preserves the secret. Do not put secrets in `VITE_*` values.

- Set `CORS_ORIGINS` to the exact public HTTPS origin, without a trailing slash.
- Generate `JWT_SECRET` once, using at least 32 random bytes, and retain it across
  restarts. The PowerShell generation commands are in the Supabase setup guide.
- Set a unique `RELEASE_TAG` for each release; retain the previous image for rollback.
- The supplied Compose service allows 1 GiB of memory and binds only to loopback.

Validate required settings without printing their values:

```sh
docker compose config --quiet
docker compose build
docker compose up -d --wait --wait-timeout 180
docker compose ps
```

If startup fails, inspect `docker compose logs --tail=100 app` locally. Resolve
missing settings, database connectivity, migration errors, or bucket permissions
before continuing. Avoid sharing logs containing credentials or signed URLs.

## Public HTTPS endpoint

Point your domain to the host and configure an HTTPS reverse proxy on that host
to forward the entire origin to `127.0.0.1:8080` (or your `APP_PORT`). For example,
a host-installed Caddy server can use this Caddyfile, replacing the domain:

```text
warranties.example.com {
    reverse_proxy 127.0.0.1:8080
}
```

Allow ports 80 and 443 for the proxy. Keep the application port private. Configure
the proxy to allow invoice uploads of at least 10 MiB plus multipart overhead.
If using a managed container platform instead, build the root Dockerfile, set
the same environment variables in its secret manager, and route HTTPS traffic
to the container's `PORT` (8080 by default). No local disk persistence is needed:
the database, private invoices, and cleanup queue live in Supabase.

## Verify the deployed release

1. Open `/actuator/health/readiness`: expect HTTP 200 and `{"status":"UP"}`.
   This checks application/database readiness; hosted receipt operations still
   need the checks below. `/actuator/health/liveness` is also public.
2. Open `/login` and reload `/dashboard`: the SPA should load. A request to
   `/api/warranties` without an Authorization header must return HTTP 401.
3. Sign up with a test account, add a warranty with a PNG/JPEG/WebP receipt,
   reload, edit the warranty and replace its receipt, then view the saved image.
4. Sign in as a second test account: its inventory must be empty. Requests for
   the first account's warranty ID must return 404, including update/delete.
   Private storage object URLs must not be publicly readable. Signed URLs are
   temporary bearer links: anyone holding one can use it until it expires.
5. Delete the warranty, reload, and confirm it stays removed. Verify replaced
   and deleted objects are removed from the private bucket after asynchronous
   cleanup. Refresh an expired invoice link through the app before deletion.
6. Log out and log back in. Repeat receipt viewing/deletion on a mobile viewport.

Record the deployment URL, release tag, date, and results in `HANDOFF.md`; mark
the hosted checkboxes in `TODO.md` only after these checks pass.

## Repeatable local checks

With Java 21+, Node 22, and Chromium installed, run from `Frontend` (use `npm.cmd`
and `npx.cmd` on Windows):

```sh
npm ci
npx playwright install chromium
npm test
npm run test:e2e
npm run test:release
npm audit --audit-level=moderate
```

`test:release` builds the frontend and bundled JAR, runs backend tests, and starts
isolated PostgreSQL and a Storage fixture for four desktop/mobile release tests.
Port 5002 must be free. It requires no hosted secrets and creates no hosted data.
The GitHub workflow runs these checks and builds the container without publishing.

## Updates and rollback

Before applying a release with new migrations, verify database backup/restore
arrangements and retain the current image tag. Build with a new `RELEASE_TAG`,
then run `docker compose up -d --wait --wait-timeout 180` and repeat smoke checks.
For an application-only rollback, set `RELEASE_TAG` to the previous local image
and run `docker compose up -d --no-build --wait --wait-timeout 180`.
Database migrations are not rolled back by changing the image: confirm schema
compatibility first. Never erase tables or migration history to repair startup.
