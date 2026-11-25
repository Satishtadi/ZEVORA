package com.zevora.operator;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface TransportOperatorRepository extends JpaRepository<TransportOperator, UUID> {
}
