package com.warrantytracker;

import java.time.Instant;
import org.slf4j.*;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.*;

@Configuration
@EnableScheduling
@ConditionalOnProperty(name="app.storage.cleanup-enabled", havingValue="true")
class StorageCleanupScheduler {
    private static final Logger log = LoggerFactory.getLogger(StorageCleanupScheduler.class);
    private final CleanupRepository tasks;
    private final StorageCleanupService cleanup;
    StorageCleanupScheduler(CleanupRepository tasks, StorageCleanupService cleanup) {
        this.tasks = tasks; this.cleanup = cleanup;
    }
    @Scheduled(fixedDelayString="${app.storage.cleanup-delay-ms:60000}", initialDelayString="${app.storage.cleanup-delay-ms:60000}")
    void clean() {
        for (StorageCleanupTask task : tasks.findTop50ByNextAttemptAtBeforeOrderByNextAttemptAtAsc(Instant.now())) {
            try { cleanup.process(task.id); }
            catch (RuntimeException ex) { log.warn("Invoice cleanup task {} will be retried.", task.id); }
        }
    }
}

