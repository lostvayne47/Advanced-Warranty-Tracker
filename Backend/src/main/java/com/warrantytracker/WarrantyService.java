package com.warrantytracker;

import java.util.*;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
@Transactional(timeout=120)
class WarrantyService {
    private final WarrantyRepository warranties;
    private final UserRepository users;
    private final InvoiceService invoices;
    WarrantyService(WarrantyRepository warranties, UserRepository users, InvoiceService invoices) {
        this.warranties = warranties; this.users = users; this.invoices = invoices;
    }
    @Transactional(readOnly=true)
    List<WarrantyView> list(UUID owner) {
        return invoices.views(warranties.findAllByOwnerIdOrderByCreatedAtDesc(owner), true);
    }
    @Transactional(readOnly=true)
    WarrantyView get(UUID id, UUID owner) {
        return invoices.views(List.of(owned(id, owner)), true).getFirst();
    }
    private Warranty owned(UUID id, UUID owner) {
        return warranties.findByIdAndOwnerId(id, owner)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Warranty not found."));
    }
    WarrantyView create(UUID owner, WarrantyRequest request) {
        validate(request);
        AppUser user = users.findById(owner)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Account no longer exists."));
        Warranty warranty = new Warranty(user);
        request.copyTo(warranty);
        warranty = warranties.saveAndFlush(warranty);
        invoices.replace(warranty, owner, request.invoiceImage);
        warranties.flush();
        return invoices.views(List.of(warranty), false).getFirst();
    }
    WarrantyView update(UUID id, UUID owner, WarrantyRequest request) {
        Warranty warranty = owned(id, owner);
        if (request.version == null)
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "The current warranty version is required.");
        if (request.version != warranty.version)
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Warranty changed. Reload it before saving.");
        validate(request);
        request.copyTo(warranty);
        invoices.replace(warranty, owner, request.invoiceImage);
        if (request.invoiceImage != null) warranty.updatedAt = java.time.Instant.now();
        warranties.flush();
        return invoices.views(List.of(warranty), false).getFirst();
    }
    void delete(UUID id, UUID owner) {
        Warranty warranty = owned(id, owner);
        invoices.removeAll(id);
        warranties.delete(warranty);
        warranties.flush();
    }
    private void validate(WarrantyRequest request) {
        if (request.expiryDate.isBefore(request.purchaseDate))
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Expiry date cannot precede purchase date.");
        if (request.coverageStartDate != null &&
            (request.coverageStartDate.isBefore(request.purchaseDate) || request.coverageStartDate.isAfter(request.expiryDate)))
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Coverage start must be between purchase and expiry dates.");
        request.productName = request.productName.trim();
    }
}
