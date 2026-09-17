package com.warrantytracker;

import java.util.*;
import org.springframework.data.jpa.repository.JpaRepository;

interface WarrantyRepository extends JpaRepository<Warranty, UUID> {
    List<Warranty> findAllByOwnerIdOrderByCreatedAtDesc(UUID ownerId);
    Optional<Warranty> findByIdAndOwnerId(UUID id, UUID ownerId);
}

