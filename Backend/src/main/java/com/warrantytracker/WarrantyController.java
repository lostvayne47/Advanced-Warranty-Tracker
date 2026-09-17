package com.warrantytracker;

import jakarta.validation.Valid;
import java.util.*;
import org.springframework.beans.propertyeditors.StringTrimmerEditor;
import org.springframework.http.*;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.WebDataBinder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/warranties")
class WarrantyController {
    private final WarrantyService service;
    WarrantyController(WarrantyService service) { this.service = service; }

    @InitBinder
    void bind(WebDataBinder binder) {
        binder.initDirectFieldAccess();
        binder.registerCustomEditor(String.class, new StringTrimmerEditor(true));
        binder.setAllowedFields("productName", "brand", "modelNumber", "serialNumber", "category", "purchaseDate", "purchasePrice", "currency", "retailerName", "retailerOrderNumber", "warrantyProvider", "warrantyType", "policyNumber", "coverageStartDate", "expiryDate", "coverageTerms", "supportPhone", "supportEmail", "supportUrl", "notes", "version", "invoiceImage");
    }
    @GetMapping
    List<Warranty> list(@AuthenticationPrincipal Jwt jwt) { return service.list(owner(jwt)); }
    @GetMapping("/{id}")
    Warranty get(@PathVariable UUID id, @AuthenticationPrincipal Jwt jwt) { return service.get(id, owner(jwt)); }

    @PostMapping(consumes=MediaType.MULTIPART_FORM_DATA_VALUE)
    @ResponseStatus(HttpStatus.CREATED)
    Warranty createForm(@Valid @ModelAttribute WarrantyRequest request, @AuthenticationPrincipal Jwt jwt) {
        return service.create(owner(jwt), request);
    }
    @PostMapping(consumes=MediaType.APPLICATION_JSON_VALUE)
    @ResponseStatus(HttpStatus.CREATED)
    Warranty createJson(@Valid @RequestBody WarrantyRequest request, @AuthenticationPrincipal Jwt jwt) {
        return service.create(owner(jwt), request);
    }
    @PutMapping(value="/{id}", consumes=MediaType.MULTIPART_FORM_DATA_VALUE)
    Warranty updateForm(@PathVariable UUID id, @Valid @ModelAttribute WarrantyRequest request,
                        @AuthenticationPrincipal Jwt jwt) { return service.update(id, owner(jwt), request); }
    @PutMapping(value="/{id}", consumes=MediaType.APPLICATION_JSON_VALUE)
    Warranty updateJson(@PathVariable UUID id, @Valid @RequestBody WarrantyRequest request,
                        @AuthenticationPrincipal Jwt jwt) { return service.update(id, owner(jwt), request); }
    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    void delete(@PathVariable UUID id, @AuthenticationPrincipal Jwt jwt) { service.delete(id, owner(jwt)); }

    private UUID owner(Jwt jwt) {
        try { return UUID.fromString(jwt.getSubject()); }
        catch (IllegalArgumentException | NullPointerException ex) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid session.");
        }
    }
}

