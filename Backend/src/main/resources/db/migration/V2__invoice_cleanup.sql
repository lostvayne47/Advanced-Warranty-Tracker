-- Durable upload intents and deletion retries; deliberately no foreign keys.
CREATE TABLE public.storage_cleanup_task (
    id UUID PRIMARY KEY,
    storage_key VARCHAR(512) NOT NULL,
    next_attempt_at TIMESTAMPTZ NOT NULL,
    attempts INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX ix_storage_cleanup_due ON public.storage_cleanup_task (next_attempt_at);
-- Only one current receipt per warranty. Replacement deletes its prior metadata.
CREATE UNIQUE INDEX uq_warranty_receipt ON public.warranty_attachment (warranty_id)
    WHERE attachment_type = 'RECEIPT';

