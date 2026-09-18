package com.warrantytracker;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import java.math.BigDecimal;
import java.time.LocalDate;

@MappedSuperclass
public abstract class WarrantyFields {
    @NotBlank @Size(max=200) @Column(nullable=false, length=200)
    public String productName;
    @Size(max=100) @Column(length=100)
    public String brand;
    @Size(max=100) @Column(length=100)
    public String modelNumber;
    @Size(max=150) @Column(length=150)
    public String serialNumber;
    @Size(max=80) @Column(length=80)
    public String category;
    @NotNull @Column(nullable=false)
    public LocalDate purchaseDate;
    @DecimalMin("0.00") @Digits(integer=10, fraction=2) @Column(precision=12, scale=2)
    public BigDecimal purchasePrice;
    @Pattern(regexp="[A-Z]{3}") @Column(length=3, columnDefinition="char(3)")
    @org.hibernate.annotations.JdbcTypeCode(org.hibernate.type.SqlTypes.CHAR)
    public String currency;
    @Size(max=160) @Column(length=160)
    public String retailerName;
    @Size(max=150) @Column(length=150)
    public String retailerOrderNumber;
    @Size(max=160) @Column(length=160)
    public String warrantyProvider;
    @NotBlank @Pattern(regexp="MANUFACTURER|EXTENDED|SELLER|INSURANCE|OTHER") @Column(nullable=false, length=30)
    public String warrantyType = "MANUFACTURER";
    @Size(max=150) @Column(length=150)
    public String policyNumber;
    
    public LocalDate coverageStartDate;
    @NotNull @Column(nullable=false)
    public LocalDate expiryDate;
    @Size(max=10000) @Column(columnDefinition="text")
    public String coverageTerms;
    @Size(max=50) @Column(length=50)
    public String supportPhone;
    @Email @Size(max=320) @Column(length=320)
    public String supportEmail;
    @Size(max=2048) @Pattern(regexp="(?i)https?://[^\\s]+", message="must be an HTTP or HTTPS URL") @Column(length=2048)
    public String supportUrl;
    @Size(max=10000) @Column(columnDefinition="text")
    public String notes;
    void copyTo(WarrantyFields target) {
        target.productName = this.productName;
        target.brand = this.brand;
        target.modelNumber = this.modelNumber;
        target.serialNumber = this.serialNumber;
        target.category = this.category;
        target.purchaseDate = this.purchaseDate;
        target.purchasePrice = this.purchasePrice;
        target.currency = this.currency;
        target.retailerName = this.retailerName;
        target.retailerOrderNumber = this.retailerOrderNumber;
        target.warrantyProvider = this.warrantyProvider;
        target.warrantyType = this.warrantyType;
        target.policyNumber = this.policyNumber;
        target.coverageStartDate = this.coverageStartDate;
        target.expiryDate = this.expiryDate;
        target.coverageTerms = this.coverageTerms;
        target.supportPhone = this.supportPhone;
        target.supportEmail = this.supportEmail;
        target.supportUrl = this.supportUrl;
        target.notes = this.notes;
    }
}
