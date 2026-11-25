package com.zevora.corporate;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface CompanyEmployeeRepository extends JpaRepository<CompanyEmployee, UUID> {
    List<CompanyEmployee> findByCompanyIdOrderByCreatedAtDesc(UUID companyId);
    Optional<CompanyEmployee> findByCompanyIdAndUserId(UUID companyId, UUID userId);
    long countByCompanyIdAndVerifiedTrue(UUID companyId);
}
