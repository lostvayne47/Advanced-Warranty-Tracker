package com.warrantytracker;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name="warranty_attachment")
class WarrantyAttachment {
    @Id UUID id;
    @Column(nullable=false) UUID warrantyId;
    @Column(nullable=false, length=255) String originalFilename;
    @Column(nullable=false, length=150) String contentType;
    @Column(nullable=false) long sizeBytes;
    @Column(nullable=false, length=512, unique=true) String storageKey;
    @Column(nullable=false, length=30) String attachmentType = "RECEIPT";
    @Column(nullable=false) Instant uploadedAt;
    @Column(nullable=false) Instant createdAt;
    @Version long version;
    protected WarrantyAttachment() {}
    WarrantyAttachment(UUID warrantyId, String key, InvoiceValidator.Image image) {
        id = UUID.randomUUID();
        this.warrantyId = warrantyId;
        originalFilename = image.filename();
        contentType = image.contentType();
        sizeBytes = image.bytes().length;
        storageKey = key;
        uploadedAt = createdAt = Instant.now();
    }
}

