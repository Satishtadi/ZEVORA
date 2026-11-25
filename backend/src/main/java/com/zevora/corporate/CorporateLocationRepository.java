package com.zevora.corporate;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface CorporateLocationRepository extends JpaRepository<CorporateLocation, UUID> {
    List<CorporateLocation> findByCompanyId(UUID companyId);
}
