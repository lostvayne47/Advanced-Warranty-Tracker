# Project handoff

## Current task
Milestone 4 is in progress: real frontend/backend release tests, dependency
readiness, deployment configuration, and live smoke testing when hosting is
available. Preserve incremental changes and update this note after each part.
Milestones 1-3 are implemented; do not rebuild them.

## Task 4 increments
1. Complete: npm audit fix applied compatible updates;
   npm audit reports zero vulnerabilities. Real release suite builds frontend
   into API JAR, starts isolated PostgreSQL + local Storage HTTP fixture, then
   runs desktop/mobile signup/create/edit/view/delete/isolation browser flows.
   Command: cd Frontend; npm.cmd run test:release.
   Passed: 22 backend tests and 4 release browser tests (desktop/mobile),
   including real packaged API, PostgreSQL, receipt replacement/cleanup,
   user isolation, and minimal health endpoints. Storage remains a fixture.
2. In progress: Docker deployment (default; no hosting choice received yet),
   minimal public health/readiness checks, same-origin bundled SPA routes,
   release workflow/docs. Docker is not installed locally.
3. Pending: deployment runbook and Docker build verification; hosted deployment depends on user
   hosting selection and Supabase setup. No hosted credentials found yet.

## Latest request: recheck remaining task 3
- Rechecked delete confirmation/retry, signed invoice viewing/refresh, and
  session/error handling. No remaining task 3 implementation items were found.
- After the dependency updates, all 4 frontend unit tests passed again;
  the 20-test desktop/mobile browser run reports passed with no failed tests
  in Frontend/test-results/.last-run.json.
- Task 4 files are preserved as incremental work. Docker is unavailable locally;
  the container and GitHub workflow have not been executed. Deployment docs and
  live Supabase/hosting setup remain to be completed when task 4 resumes.

## Existing state
- Milestone 1 implemented: Spring Boot JWT authentication and user-scoped CRUD.
- Milestone 2 code implemented; 22 backend tests passed, including native
  PostgreSQL migrations and a local Supabase HTTP test double. Hosted Supabase
  does not exist yet; setup is documented in Database/SUPABASE_SETUP.md.
- Existing uncommitted backend changes belong to milestone 2. Preserve them.
- No project AGENTS.md found. Do not delegate unless explicitly authorized.

## Task 3 increments
1. Complete: session expiry event updates React auth,
   JWT expiry timer/restore checks, stale-request protection, cross-tab sync,
   shared API errors, field-error mapping, retryable inventory hook, dashboard
   load-error state. Login 401 does not clear unrelated session state.
2. Complete: native modal confirmation, delete API/demo
   service, desktop/mobile actions, inventory removal only on successful delete,
   receipt viewer fetching fresh URLs with explicit refresh/error recovery.
3. Complete: edit loading failure prevents blank saves,
   null fields normalized, conflict reload confirmation, retained form on errors,
   saved-receipt viewing, JPEG/PNG/WebP/size/pixel validation, stale file checks,
   upload removal, disabled duplicate submissions, field/server error summary.
4. Complete: Playwright installed (Chromium), desktop/mobile browser coverage
   in Frontend/tests/browser/integration.spec.js; Node unit tests in tests/unit.
   Unit tests: 4 passed. Browser tests: 20 passed (10 scenarios x 2 viewports).

## API facts
- GET /warranties and /warranties/{id} return fileName/invoiceImageUrl.
- Signed receipt URLs expire in five minutes; fetch the item again to refresh.
- POST/PUT mutations return fileName but no signed URL; updates require version.
- DELETE /warranties/{id} returns 204; receipt cleanup is asynchronous.
- Errors have message and optional errors field map; 401 means expired/invalid
  session, 409 stale edit, 413 oversized file, 503 storage unavailable.
- Receipts: JPEG/PNG/still WebP, max 10 MiB, max 20 million pixels, each side
  <=12000 pixels. Backend validates/re-encodes content.

## Resume
Read this file and TODO.md, then inspect git diff/status. Frontend uses React 19,
Vite, Tailwind, Axios. Use npm.cmd on Windows (npm.ps1 is blocked).
No frontend test framework was present at task start.

Verification: production builds passed after increment 1 and after increments
2/3; 4 unit tests and 20 browser tests passed. Run npm.cmd run test:e2e for browser tests
(starts isolated Vite on port 5174, mocks API port 5001; no hosted credentials).
Next: milestone 4 real frontend/backend end-to-end verification and deployment.
Hosted Supabase setup remains pending and must not be marked verified. All
implementation changes are in the working tree; no commits were created.

Dependency note: task 4 ran npm audit fix within compatible ranges; all 11
previously reported frontend advisories are resolved (zero audit findings).
