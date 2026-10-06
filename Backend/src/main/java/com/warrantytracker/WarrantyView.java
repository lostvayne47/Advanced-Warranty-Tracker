package com.warrantytracker;

import java.time.Instant;
import java.util.UUID;

/** Explicit response DTO prevents attachment keys or persistence relationships leaking. */
public class WarrantyView extends WarrantyFields {
    public UUID id;
    public String status;
    public Instant createdAt;
    public Instant updatedAt;
    public long version;
    public String fileName;
    public String invoiceImageUrl;

    WarrantyView(Warranty warranty, String fileName, String invoiceImageUrl) {
        warranty.copyTo(this);
        id = warranty.id; status = warranty.status;
        createdAt = warranty.createdAt; updatedAt = warranty.updatedAt; version = warranty.version;
        this.fileName = fileName; this.invoiceImageUrl = invoiceImageUrl;
    }
}

