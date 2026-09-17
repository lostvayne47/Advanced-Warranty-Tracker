package com.warrantytracker;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "app_user")
class AppUser {
    @Id UUID id;
    @Column(name = "full_name", nullable = false, length = 120) String name;
    @Column(nullable = false, unique = true, length = 320) String email;
    @Column(name = "password_hash") String passwordHash;
    @Column(nullable = false) Instant createdAt;
    @Column(nullable = false) Instant updatedAt;
    @Version long version;
    protected AppUser() {}
    AppUser(String name, String email, String hash) {
        this.id = UUID.randomUUID();
        this.name = name;
        this.email = email;
        this.passwordHash = hash;
        this.createdAt = this.updatedAt = Instant.now();
    }
}

