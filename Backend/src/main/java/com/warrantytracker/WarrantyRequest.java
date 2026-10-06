package com.warrantytracker;

import jakarta.validation.constraints.PositiveOrZero;
import org.springframework.web.multipart.MultipartFile;

/** Explicit request DTO: ownership, timestamps and IDs cannot be mass-assigned. */
public class WarrantyRequest extends WarrantyFields {
    @PositiveOrZero public Long version;
    public MultipartFile invoiceImage;
}

