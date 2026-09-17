package com.warrantytracker;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name="warranty")
public class Warranty extends WarrantyFields {
    @Id public UUID id;
    @JsonIgnore @ManyToOne(fetch=FetchType.LAZY, optional=false)
    @JoinColumn(name="user_id", nullable=false)
    AppUser owner;
    @Column(nullable=false, length=20) public String status = "ACTIVE";
    @Column(nullable=false, updatable=false) public Instant createdAt;
    @Column(nullable=false) public Instant updatedAt;
    @Version public long version;

    protected Warranty() {}
    Warranty(AppUser owner) {
        this.id = UUID.randomUUID();
        this.owner = owner;
    }
    @PrePersist void created() { createdAt = updatedAt = Instant.now(); }
    @PreUpdate void updated() { updatedAt = Instant.now(); }
}

