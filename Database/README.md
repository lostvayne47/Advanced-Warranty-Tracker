# Database model

This folder contains the Supabase PostgreSQL and Storage design for Warranty
Tracker. The Spring Boot API owns all database and storage access; the React app
only reads and writes through that API.

For a new project, follow [SUPABASE_SETUP.md](SUPABASE_SETUP.md). Start Spring
Boot with the `supabase` profile to apply versioned Flyway migrations from
`Backend/src/main/resources/db/`. Do not also run the legacy SQL snapshots:
`schema.sql` describes the original model and `supabase-storage.sql` the bucket.
The migrations now also add a durable cleanup queue, one-receipt-per-warranty
constraint, and deny browser roles direct access to application tables.

## Tables

| Table | Purpose |
| --- | --- |
| `app_user` | Account identity and password hash. |
| `user_identity` | OAuth identities, including a verified Google account subject. |
| `gmail_connection` | An optional Gmail authorization; refresh tokens are encrypted before storage. |
| `warranty` | One product and its purchase, coverage, and support details. |
| `warranty_attachment` | Metadata for receipt, warranty card, manual, or photo files. The file itself belongs in Supabase Storage, identified by `storage_key`. |
| `warranty_reminder` | Scheduled expiry notifications. |
| `storage_cleanup_task` | Durable upload intents and deletion retries; no client access. |

`warranty.user_id` ensures every record belongs to exactly one user. The API
must always scope warranty queries and mutations to the authenticated user.
The `version` columns support optimistic locking in JPA (`@Version`), so a
frontend and backend update cannot silently overwrite each other.

## Supabase architecture

Use a **private** Supabase Storage bucket named `invoices`. Do not use public
URLs and do not put the Supabase service-role key or database password in the
React app.

```text
React app -> Spring Boot API -> Supabase Postgres
                         -> Supabase Storage (private invoices bucket)
```

Spring Boot receives the invoice, validates it, and uploads it as:
`{userId}/{warrantyId}/{uuid}.{extension}`. It saves that path in
`warranty_attachment.storage_key`. On a later read request, Spring Boot checks
that the authenticated user owns the warranty and creates a short-lived signed
download URL; only then does it return `invoiceImageUrl` to the frontend.

## Google sign-in and Gmail invoice import

Google sign-in and Gmail invoice import are separate OAuth grants:

| Feature | Scope | Stored data |
| --- | --- | --- |
| Google sign-in | `openid email profile` | Google subject in `user_identity`; no Google token is needed after app session creation. |
| Gmail invoice import (optional) | `gmail.readonly` | Encrypted refresh token, granted scopes, Gmail address, and revocation state in `gmail_connection`. |

Use the authorization-code flow with PKCE. Spring Boot must validate `state`,
PKCE verifier, issuer, audience, nonce, and redirect URI before creating a
session or saving a connection. The Google OAuth client secret, token-encryption
key, and refresh token are server-only secrets.

Suggested endpoints:

```text
GET  /auth/google/start?purpose=signin
GET  /auth/google/callback
GET  /gmail/connect                 # starts the separate gmail.readonly grant
GET  /gmail/callback
GET  /gmail/invoices                # returns user-approved receipt candidates only
POST /gmail/invoices/{messageId}/extract
DELETE /gmail/connections/{id}      # revokes token at Google and deletes local token
```

For an import, retrieve only a user-selected message attachment, send that file
to the planned invoice-extraction pipeline, and save it to the private
Supabase bucket only after the user confirms the warranty. Do not persist full
email bodies or continuously scan a mailbox by default. Gmail read scopes are
restricted and may require Google OAuth verification and a security assessment
before public production use.

Configure these server-only environment variables in Spring Boot:

```text
SUPABASE_URL=https://<project-ref>.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<server-only-secret>
SUPABASE_DB_URL=jdbc:postgresql://db.<project-ref>.supabase.co:5432/postgres
SUPABASE_DB_USERNAME=postgres
SUPABASE_DB_PASSWORD=<database-password>
```

## API field mapping

Use camelCase JSON in the frontend/API and snake_case in PostgreSQL/JPA.
Existing frontend fields map directly:

| API field | Database column |
| --- | --- |
| `id` | `warranty.id` |
| `productName` | `product_name` |
| `purchaseDate` | `purchase_date` |
| `expiryDate` | `expiry_date` |
| `notes` | `notes` |
| `invoiceImage` | a `warranty_attachment` record with `attachment_type = 'RECEIPT'`; expose `originalFilename` as `fileName` if needed |

Suggested warranty endpoints: `GET /warranties`, `POST /warranties`,
`GET /warranties/{id}`, `PUT /warranties/{id}`, `DELETE /warranties/{id}`, and
`POST /warranties/{id}/attachments`. Keep attachment files outside the database
and store only the durable object-storage key and metadata here.

## Invoice extraction flow (planned)

1. The frontend sends `POST /invoice-extractions` as `multipart/form-data`
   with an `invoiceImage` image file.
2. The API stores the temporary image, runs OCR/extraction, and returns
   `200 OK` with `{ "extractedData": { ... } }`. The nested object may contain
   only warranty API fields such as `productName`, `brand`, `purchaseDate`,
   `purchasePrice`, `currency`, `retailerName`, `retailerOrderNumber`, and
   `expiryDate`.
3. The frontend displays those values in editable inputs. It must not create a
   warranty at this point.
4. On user confirmation, `POST /warranties` receives all reviewed fields and
   the same `invoiceImage`. The API creates the `warranty` and
   `warranty_attachment` rows in one transaction, and persists the image in
   Supabase Storage before recording its `storage_key`.

For `GET /warranties` and `GET /warranties/{id}`, return `fileName` and an
authorized, time-limited `invoiceImageUrl` when a receipt image exists. The
frontend uses that URL to show the stored invoice; it must never receive a raw
storage key.

Implemented upload validation decodes the image, checks type, size and pixel
limits, and re-encodes its pixels before storage. It strips original metadata
and trailing content; it does not provide malware-signature scanning.
Never trust future extracted values without the user's confirmation.

Do not accept client ownership, IDs, or timestamps. Ignore client `version`
on creation; require the current version as a precondition on updates.
Set the user from the authenticated session, manage timestamps on the server,
and use the returned `version` in updates to detect conflicting edits.
