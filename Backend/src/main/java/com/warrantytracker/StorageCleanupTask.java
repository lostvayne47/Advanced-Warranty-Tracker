package com.warrantytracker;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name="storage_cleanup_task")
class StorageCleanupTask {
    @Id UUID id;
    @Column(nullable=false, length=512) String storageKey;
    @Column(nullable=false) Instant nextAttemptAt;
    @Column(nullable=false) int attempts;
    @Column(nullable=false) Instant createdAt;
    protected StorageCleanupTask() {}
    StorageCleanupTask(String key, Instant due) {
        id = UUID.randomUUID(); storageKey = key; nextAttemptAt = due; createdAt = Instant.now();
    }
}

