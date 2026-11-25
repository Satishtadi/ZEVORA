package com.zevora.driver;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface VehicleRepository extends JpaRepository<Vehicle, UUID> {
    List<Vehicle> findByDriverId(UUID driverId);
    Optional<Vehicle> findByIdAndDriverId(UUID id, UUID driverId);
    boolean existsByPlateNumberIgnoreCase(String plateNumber);
}
