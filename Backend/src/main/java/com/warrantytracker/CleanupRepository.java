package com.warrantytracker;

import jakarta.persistence.LockModeType;
import java.time.Instant;
import java.util.*;
import org.springframework.data.jpa.repository.*;

interface CleanupRepository extends JpaRepository<StorageCleanupTask, UUID> {
    List<StorageCleanupTask> findTop50ByNextAttemptAtBeforeOrderByNextAttemptAtAsc(Instant now);
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select task from StorageCleanupTask task where task.id = :id")
    Optional<StorageCleanupTask> lockById(UUID id);
}

