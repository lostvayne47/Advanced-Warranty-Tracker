package com.warrantytracker;

import java.time.Instant;
import java.util.UUID;
import org.slf4j.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.*;

@Service
class StorageCleanupService {
    private static final Logger log = LoggerFactory.getLogger(StorageCleanupService.class);
    private final CleanupRepository tasks;
    private final AttachmentRepository attachments;
    private final InvoiceStorage storage;
    StorageCleanupService(CleanupRepository tasks, AttachmentRepository attachments, InvoiceStorage storage) {
        this.tasks = tasks; this.attachments = attachments; this.storage = storage;
    }
    /** Commit intent before uploading; it survives upload timeouts, rollback and process crashes. */
    @Transactional(propagation=Propagation.REQUIRES_NEW)
    UUID prepareUpload(String key) {
        return tasks.saveAndFlush(new StorageCleanupTask(key, Instant.now().plusSeconds(3600))).id;
    }
    /** Existing receipts are queued in the same transaction that removes their metadata. */
    @Transactional(propagation=Propagation.MANDATORY)
    void enqueueDeletion(String key) {
        tasks.save(new StorageCleanupTask(key, Instant.now()));
    }
    @Transactional(propagation=Propagation.REQUIRES_NEW, timeout=45)
    void process(UUID id) {
        StorageCleanupTask task = tasks.lockById(id).orElse(null);
        if (task == null || task.nextAttemptAt.isAfter(Instant.now())) return;
        // A committed receipt always wins over an old upload-intent/duplicate cleanup task.
        if (attachments.existsByStorageKey(task.storageKey)) {
            tasks.delete(task);
            return;
        }
        try {
            storage.delete(task.storageKey);
            tasks.delete(task);
        } catch (StorageUnavailableException ex) {
            task.attempts++;
            task.nextAttemptAt = Instant.now().plusSeconds(Math.min(3600, 60L << Math.min(task.attempts - 1, 6)));
            log.warn("Invoice cleanup task {} failed (attempt {}); retry scheduled.", task.id, task.attempts);
        }
    }
}

