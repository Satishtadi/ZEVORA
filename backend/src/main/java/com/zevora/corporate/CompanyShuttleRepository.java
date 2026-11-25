package com.zevora.corporate;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface CompanyShuttleRepository extends JpaRepository<CompanyShuttle, UUID> {
    List<CompanyShuttle> findByActiveTrue();
    List<CompanyShuttle> findByCompanyIdOrderByDepartureTimeAsc(UUID companyId);
}
