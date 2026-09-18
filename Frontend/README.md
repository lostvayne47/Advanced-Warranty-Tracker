# Warranty Tracker Frontend

A React application built with Vite and Tailwind CSS for tracking product warranties.

## Features

- Dark glassmorphism UI with a centralized theme config in `src/config/theme.js`
- Login/signup with JWT persistence, expiry redirects, and cross-tab session synchronization
- Protected routes using React Router
- Dashboard analytics, loading states, and retryable load errors
- Searchable inventory with desktop/mobile edit, view-invoice, and delete actions
- Delete confirmation that retains the item when deletion fails
- Stored invoice viewer that fetches a fresh signed URL on open and supports refresh
- Add/edit form with optional invoice selection, preview, and replacement
- JPEG/PNG/WebP validation: 10 MB, 20 megapixels, 12,000 pixels per side
- Server validation messages and conflict recovery without silently losing edits
- Axios service layer with API mode and local demo fallback when `VITE_API_URL` is not set
- Toast notifications and responsive reusable components

## Getting Started

1. Install dependencies:

```bash
npm install
```

2. Copy `.env.example` to `.env` and set your backend API URL if available:

```bash
VITE_API_URL=http://localhost:5000/api
```

3. Run the development server:

```bash
npm run dev
```

4. Create a production build:

```bash
npm run build
```

On Windows PowerShell, use `npm.cmd`/`npx.cmd` if execution policy blocks the
PowerShell wrappers.

## Backend integration

Start the Spring Boot API using [Backend/README.md](../Backend/README.md).
Real receipt storage requires the [Supabase setup](../Database/SUPABASE_SETUP.md).
Sign out of any old demo session when switching to the real API.

The invoice viewer requests a fresh link from the API each time it opens.
Use **Refresh invoice** if an image link expires while viewing it.
On edit, omitting a new file keeps the saved receipt; removing a selected
replacement cancels that replacement. Deleting a warranty removes it from
the list after the API succeeds; storage cleanup happens on the backend.

A stale edit (409) preserves the current form and offers **Reload latest
warranty** with discard confirmation. Copy any changes you need before
reloading. Failed initial loads never expose a blank editable form.
Expired/invalid sessions return to login with an explanation; login failures
show credential errors separately.

Demo mode keeps warranty data in browser storage and supports deletion, but
stores only invoice filenames, not image contents. It does not provide real
account isolation or authentication. OCR, Google/Gmail integration and scheduled
notifications remain later milestones.

## Verification

```bash
npm test
npx playwright install chromium
npm run test:e2e
npm run build
```

Unit tests cover expiry parsing, validation boundaries, and API errors.
Browser tests exercise desktop and mobile layouts with a mocked API, including
delete cancel/failure/retry, fresh receipt links, 401 redirects, failed login,
retryable loads, stale edits, field errors, and multipart uploads.
Playwright starts an isolated Vite server on port 5174 and intercepts API
requests to port 5001. It does not need or verify a hosted Supabase project.
Real frontend-to-backend and hosted storage verification is milestone 4.

Project progress and resumption notes are kept in [TODO.md](../TODO.md) and
[HANDOFF.md](../HANDOFF.md).
