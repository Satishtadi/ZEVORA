package com.zevora.operator;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface OperatorDriverRepository extends JpaRepository<OperatorDriver, UUID> {
    List<OperatorDriver> findByOperatorId(UUID operatorId);
}
