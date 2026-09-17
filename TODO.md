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

## 2. Supabase database and private invoice storage
- [ ] Configure Supabase PostgreSQL and apply migrations.
- [ ] Implement validated invoice uploads to the private bucket.
- [ ] Persist attachment metadata and provide authorized signed download URLs.
- [ ] Handle storage cleanup and failed transactions.

## 3. Complete frontend integration
- [ ] Add delete with confirmation.
- [ ] Complete stored invoice viewing.
- [ ] Fix expired-session handling and actionable API errors.
- [ ] Align upload validation with supported formats and size limits.

## 4. Verify and deploy the first release
- [ ] Verify signup → add → edit → view receipt → delete end to end.
- [ ] Verify separate users cannot access one another's warranties or receipts.
- [ ] Configure production secrets, origins, database, and hosting.
- [ ] Deploy and smoke-test the release.

## 5. Subsequent milestones
- [ ] Implement OCR extraction with user review before saving.
- [ ] Complete Google sign-in.
- [ ] Complete optional Gmail connection, invoice selection/import, and disconnect.
- [ ] Implement scheduled expiry reminders and notification delivery.
