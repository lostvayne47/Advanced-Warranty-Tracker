-- Only the backend accesses app tables. Supabase browser roles get no access.
ALTER TABLE public.app_user ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.app_user FROM anon, authenticated;
ALTER TABLE public.user_identity ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.user_identity FROM anon, authenticated;
ALTER TABLE public.gmail_connection ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.gmail_connection FROM anon, authenticated;
ALTER TABLE public.warranty ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.warranty FROM anon, authenticated;
ALTER TABLE public.warranty_attachment ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.warranty_attachment FROM anon, authenticated;
ALTER TABLE public.warranty_reminder ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.warranty_reminder FROM anon, authenticated;
ALTER TABLE public.storage_cleanup_task ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.storage_cleanup_task FROM anon, authenticated;
REVOKE ALL ON SCHEMA warranty_migrations FROM anon, authenticated;
REVOKE ALL ON ALL TABLES IN SCHEMA warranty_migrations FROM anon, authenticated;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('invoices', 'invoices', FALSE, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO UPDATE
SET public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

