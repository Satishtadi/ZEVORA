package com.zevora.operator;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface OperatorRouteRepository extends JpaRepository<OperatorRoute, UUID> {
    List<OperatorRoute> findByActiveTrue();
    List<OperatorRoute> findByOperatorIdOrderByCreatedAtDesc(UUID operatorId);
}
