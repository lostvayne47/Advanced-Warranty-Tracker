-- Run this after schema.sql in the Supabase SQL editor or as a Supabase
-- migration. It creates a private bucket for invoices.
--
-- Spring Boot uploads with the Supabase service-role key. Service-role access
-- bypasses RLS, so never expose that key to the browser.

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'invoices',
    'invoices',
    FALSE,
    10485760,
    ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE
SET
    public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Do not create browser-facing storage policies yet. The React app uses the
-- Spring Boot API, which authenticates the user and performs storage actions
-- with the service role. This keeps invoice access in one authorization layer.
