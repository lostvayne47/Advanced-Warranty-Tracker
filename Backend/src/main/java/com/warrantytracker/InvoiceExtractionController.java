package com.warrantytracker;

import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/invoice-extractions")
class InvoiceExtractionController {
    private final GeminiInvoiceExtractor extractor;
    private final InvoiceValidator validator;

    InvoiceExtractionController(GeminiInvoiceExtractor extractor, InvoiceValidator validator) {
        this.extractor = extractor;
        this.validator = validator;
    }

    @PostMapping(consumes = "multipart/form-data")
    GeminiInvoiceExtractor.Result extract(@RequestParam("invoiceImage") MultipartFile image) {
        extractor.checkConfigured();
        return extractor.extract(validator.validate(image));
    }
}
