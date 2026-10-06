package com.warrantytracker;

import java.util.*;
import org.springframework.data.jpa.repository.JpaRepository;

interface AttachmentRepository extends JpaRepository<WarrantyAttachment, UUID> {
    List<WarrantyAttachment> findAllByWarrantyId(UUID warrantyId);
    List<WarrantyAttachment> findAllByWarrantyIdInAndAttachmentType(Collection<UUID> warrantyIds, String type);
    boolean existsByStorageKey(String key);
}

