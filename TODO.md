# Warranty Tracker release TODO

## 1. Spring Boot authentication and user-scoped warranty CRUD — complete
- [x] Scaffold backend and reproducible build.
- [x] Implement signup/login with password hashing and expiring JWTs.
- [x] Implement authenticated create/list/read/update/delete scoped to the current user.
- [x] Validate input, handle errors, and reject conflicting updates.
- [x] Test authentication, CRUD, and isolation between users; document local setup.

Verified: 11 integration tests pass, Maven verify produces a runnable JAR, and
the packaged server passes a real HTTP signup → multipart create → multipart
update → read → delete smoke test. Tests use H2; Supabase verification remains
in milestone 2. Setup instructions: [Backend/README.md](Backend/README.md).

## 2. Supabase database and private invoice storage - implementation complete; hosted setup pending
- [x] Configure the Supabase profile and versioned database/bucket migrations.
- [x] Apply and verify migrations against isolated PostgreSQL tests.
- [x] Implement validated invoice uploads to the private bucket.
- [x] Persist attachment metadata and provide authorized signed download URLs.
- [x] Handle storage cleanup and failed transactions with a durable retry queue.
- [x] Prepare setup instructions for a new Supabase project.
- [ ] Create/configure the hosted Supabase project and apply migrations there.
- [ ] Verify hosted upload, signed download, replacement, and deletion cleanup.

No hosted project is available yet. Follow [Database/SUPABASE_SETUP.md](Database/SUPABASE_SETUP.md)
when creating it. Automated checks pass against PostgreSQL 17 and a local
Supabase Storage HTTP test double; they do not substitute for hosted verification.

## 3. Complete frontend integration - complete
- [x] Add delete with confirmation.
- [x] Complete stored invoice viewing, including fresh/refreshable signed links.
- [x] Fix expired-session handling and actionable API errors.
- [x] Align upload validation with supported formats and size/pixel limits.

Verified again after dependency updates: 4 frontend unit tests and 20 Chromium
browser tests across desktop and mobile viewports pass. These browser tests mock
the API; milestone 4 also passed its packaged-app/PostgreSQL release suite with
a local Storage fixture. Incremental changes and resumption notes are saved in
[HANDOFF.md](HANDOFF.md).

## 4. Verify and deploy the first release - in progress
- [x] Verify signup → add → edit → view receipt → delete against packaged app, PostgreSQL, and local Storage fixture.
- [x] Verify user isolation and private receipt access in the local release suite.
- [x] Prepare bundled frontend/API container, health checks, CI workflow, and deployment runbook.
- [ ] Build and verify the Docker container on a Docker-enabled host.
- [ ] Configure production secrets, origins, database, and hosting.
- [ ] Deploy and smoke-test the release.

Local verification passed: 22 backend tests and 4 release browser tests, plus
4 frontend unit tests and 20 mocked-API browser tests. Hosted Supabase checks
remain pending under task 2. Follow [DEPLOYMENT.md](DEPLOYMENT.md) for setup,
deployment, smoke checks, and rollback. Docker and CI have not yet been executed.

## 5. Subsequent milestones
- [ ] Implement OCR extraction with user review before saving.
- [ ] Complete Google sign-in.
- [ ] Complete optional Gmail connection, invoice selection/import, and disconnect.
- [ ] Implement scheduled expiry reminders and notification delivery.
