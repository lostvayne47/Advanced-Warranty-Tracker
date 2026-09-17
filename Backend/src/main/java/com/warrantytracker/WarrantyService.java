package com.warrantytracker;

import java.util.*;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
@Transactional
class WarrantyService {
    private final WarrantyRepository warranties;
    private final UserRepository users;
    WarrantyService(WarrantyRepository warranties, UserRepository users) {
        this.warranties = warranties; this.users = users;
    }
    @Transactional(readOnly=true)
    List<Warranty> list(UUID owner) { return warranties.findAllByOwnerIdOrderByCreatedAtDesc(owner); }
    @Transactional(readOnly=true)
    Warranty get(UUID id, UUID owner) {
        return warranties.findByIdAndOwnerId(id, owner)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Warranty not found."));
    }
    Warranty create(UUID owner, WarrantyRequest request) {
        validate(request);
        AppUser user = users.findById(owner)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Account no longer exists."));
        Warranty warranty = new Warranty(user);
        request.copyTo(warranty);
        return warranties.saveAndFlush(warranty);
    }
    Warranty update(UUID id, UUID owner, WarrantyRequest request) {
        Warranty warranty = get(id, owner);
        if (request.version == null)
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "The current warranty version is required.");
        if (request.version != warranty.version)
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Warranty changed. Reload it before saving.");
        validate(request);
        request.copyTo(warranty);
        return warranties.saveAndFlush(warranty);
    }
    void delete(UUID id, UUID owner) {
        warranties.delete(get(id, owner));
        warranties.flush();
    }
    private void validate(WarrantyRequest request) {
        if (request.invoiceImage != null && !request.invoiceImage.isEmpty())
            throw new ResponseStatusException(HttpStatus.NOT_IMPLEMENTED,
                "Invoice storage is not available yet. Save without an attachment.");
        if (request.expiryDate.isBefore(request.purchaseDate))
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Expiry date cannot precede purchase date.");
        if (request.coverageStartDate != null &&
            (request.coverageStartDate.isBefore(request.purchaseDate) || request.coverageStartDate.isAfter(request.expiryDate)))
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Coverage start must be between purchase and expiry dates.");
        request.productName = request.productName.trim();
    }
}

