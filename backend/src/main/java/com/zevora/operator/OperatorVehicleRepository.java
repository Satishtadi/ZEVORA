package com.zevora.operator;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface OperatorVehicleRepository extends JpaRepository<OperatorVehicle, UUID> {
    List<OperatorVehicle> findByOperatorId(UUID operatorId);
}
