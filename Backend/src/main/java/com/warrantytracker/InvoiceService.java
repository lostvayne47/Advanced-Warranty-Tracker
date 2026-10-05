package com.warrantytracker;

import java.util.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@Service
@Transactional(propagation=Propagation.MANDATORY)
class InvoiceService {
    private final InvoiceValidator validator;
    private final InvoiceStorage storage;
    private final AttachmentRepository attachments;
    private final StorageCleanupService cleanup;
    private final CleanupRepository tasks;

    InvoiceService(InvoiceValidator validator, InvoiceStorage storage, AttachmentRepository attachments,
                   StorageCleanupService cleanup, CleanupRepository tasks) {
        this.validator = validator; this.storage = storage; this.attachments = attachments;
        this.cleanup = cleanup; this.tasks = tasks;
    }
    void replace(Warranty warranty, UUID owner, MultipartFile file) {
        if (file == null) return;
        InvoiceValidator.Image image = validator.validate(file);
        String key = owner + "/" + warranty.id + "/" + UUID.randomUUID() + "." + image.extension();
        UUID intent = cleanup.prepareUpload(key);
        // Hold this row lock until commit/rollback. Cleanup cannot race a live upload.
        tasks.lockById(intent).orElseThrow();
        storage.upload(key, image.bytes(), image.contentType());
        for (WarrantyAttachment previous : attachments.findAllByWarrantyId(warranty.id)) {
            if ("RECEIPT".equals(previous.attachmentType)) {
                cleanup.enqueueDeletion(previous.storageKey);
                attachments.delete(previous);
            }
        }
        attachments.flush();
        attachments.saveAndFlush(new WarrantyAttachment(warranty.id, key, image));
    }
    void removeAll(UUID warrantyId) {
        for (WarrantyAttachment attachment : attachments.findAllByWarrantyId(warrantyId)) {
            cleanup.enqueueDeletion(attachment.storageKey);
            attachments.delete(attachment);
        }
        attachments.flush();
    }
    List<WarrantyView> views(List<Warranty> warranties, boolean sign) {
        if (warranties.isEmpty()) return List.of();
        Map<UUID, WarrantyAttachment> receipts = new HashMap<>();
        attachments.findAllByWarrantyIdInAndAttachmentType(warranties.stream().map(w -> w.id).toList(), "RECEIPT")
            .forEach(a -> receipts.put(a.warrantyId, a));
        return warranties.stream().map(w -> {
            WarrantyAttachment receipt = receipts.get(w.id);
            return new WarrantyView(w, receipt == null ? null : receipt.originalFilename,
                receipt != null && sign ? storage.signedUrl(receipt.storageKey) : null);
        }).toList();
    }
}
