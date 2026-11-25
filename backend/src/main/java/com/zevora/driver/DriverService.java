package com.zevora.driver;

import com.zevora.common.ApiException;
import com.zevora.common.Enums.DriverStatus;
import com.zevora.common.Enums.DriverType;
import com.zevora.common.Enums.Role;
import com.zevora.security.SecurityUtils;
import com.zevora.user.User;
import com.zevora.user.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Service
public class DriverService {
    private final DriverRepository driverRepository;
    private final VehicleRepository vehicleRepository;
    private final UserRepository userRepository;

    public DriverService(DriverRepository driverRepository, VehicleRepository vehicleRepository, UserRepository userRepository) {
        this.driverRepository = driverRepository;
        this.vehicleRepository = vehicleRepository;
        this.userRepository = userRepository;
    }

    public Driver currentDriver() {
        return driverRepository.findByUserId(SecurityUtils.userId())
                .orElseThrow(() -> ApiException.notFound("DRIVER_NOT_FOUND", "Register as a driver first"));
    }

    public Driver requireDriver(UUID driverId) {
        return driverRepository.findById(driverId)
                .orElseThrow(() -> ApiException.notFound("DRIVER_NOT_FOUND", "Driver not found"));
    }

    @Transactional
    public DriverDtos.DriverResponse register(DriverDtos.RegisterDriverRequest req) {
        User user = userRepository.findById(SecurityUtils.userId())
                .orElseThrow(() -> ApiException.notFound("USER_NOT_FOUND", "User not found"));
        if (driverRepository.findByUserId(user.getId()).isPresent()) {
            throw ApiException.conflict("DRIVER_EXISTS", "You already have a driver profile");
        }
        Driver driver = Driver.builder()
                .userId(user.getId())
                .driverType(req.driverType())
                .licenseNumber(req.licenseNumber().trim().toUpperCase())
                .licenseVerified(false)
                .identityVerified(false)
                .status(DriverStatus.PENDING)
                .rating(BigDecimal.valueOf(5.00))
                .totalRides(0)
                .available(false)
                .build();
        driver = driverRepository.save(driver);
        user.setRole(req.driverType() == DriverType.COMMERCIAL ? Role.COMMERCIAL_DRIVER : Role.PRIVATE_CARPOOL_DRIVER);
        userRepository.save(user);
        return toResponse(driver);
    }

    @Transactional(readOnly = true)
    public DriverDtos.DriverResponse profile() {
        return toResponse(currentDriver());
    }

    @Transactional
    public DriverDtos.DriverResponse setAvailability(DriverDtos.AvailabilityRequest req) {
        Driver driver = currentDriver();
        driver.setAvailable(req.available());
        if (req.lat() != null) driver.setCurrentLat(req.lat());
        if (req.lng() != null) driver.setCurrentLng(req.lng());
        return toResponse(driverRepository.save(driver));
    }

    @Transactional
    public DriverDtos.VehicleResponse addVehicle(DriverDtos.VehicleRequest req) {
        Driver driver = currentDriver();
        String plate = req.plateNumber().trim().toUpperCase().replaceAll("\\s", "");
        if (vehicleRepository.existsByPlateNumberIgnoreCase(plate)) {
            throw ApiException.conflict("PLATE_EXISTS", "A vehicle with this number plate is already registered");
        }
        Vehicle vehicle = Vehicle.builder()
                .driverId(driver.getId())
                .make(req.make())
                .model(req.model())
                .plateNumber(plate)
                .color(req.color())
                .seatCapacity(req.seatCapacity())
                .verified(false)
                .build();
        return DriverDtos.VehicleResponse.from(vehicleRepository.save(vehicle));
    }

    @Transactional(readOnly = true)
    public List<DriverDtos.VehicleResponse> vehicles() {
        Driver driver = currentDriver();
        return vehicleRepository.findByDriverId(driver.getId()).stream()
                .map(DriverDtos.VehicleResponse::from).toList();
    }

    @Transactional
    public DriverDtos.VehicleResponse updateVehicle(UUID id, DriverDtos.VehicleRequest req) {
        Driver driver = currentDriver();
        Vehicle vehicle = vehicleRepository.findByIdAndDriverId(id, driver.getId())
                .orElseThrow(() -> ApiException.notFound("VEHICLE_NOT_FOUND", "Vehicle not found"));
        vehicle.setMake(req.make());
        vehicle.setModel(req.model());
        vehicle.setColor(req.color());
        vehicle.setSeatCapacity(req.seatCapacity());
        vehicle.setVerified(false);
        return DriverDtos.VehicleResponse.from(vehicleRepository.save(vehicle));
    }

    public DriverDtos.DriverResponse toResponse(Driver driver) {
        User user = userRepository.findById(driver.getUserId()).orElse(null);
        List<DriverDtos.VehicleResponse> vehicles = vehicleRepository.findByDriverId(driver.getId()).stream()
                .map(DriverDtos.VehicleResponse::from).toList();
        return new DriverDtos.DriverResponse(driver.getId(), driver.getUserId(),
                user != null ? user.getFullName() : "Driver",
                user != null ? user.getEmail() : null,
                user != null ? user.getPhone() : null,
                driver.getDriverType(), driver.getLicenseNumber(), driver.isLicenseVerified(),
                driver.isIdentityVerified(), driver.getStatus(), driver.getRating(), driver.getTotalRides(),
                driver.isAvailable(), vehicles);
    }
}
