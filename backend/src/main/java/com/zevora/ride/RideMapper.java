package com.zevora.ride;

import com.zevora.common.Enums.DriverStatus;
import com.zevora.driver.Driver;
import com.zevora.driver.DriverRepository;
import com.zevora.driver.Vehicle;
import com.zevora.driver.VehicleRepository;
import com.zevora.user.User;
import com.zevora.user.UserRepository;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;

@Component
public class RideMapper {
    private final DriverRepository driverRepository;
    private final VehicleRepository vehicleRepository;
    private final UserRepository userRepository;

    public RideMapper(DriverRepository driverRepository, VehicleRepository vehicleRepository,
                      UserRepository userRepository) {
        this.driverRepository = driverRepository;
        this.vehicleRepository = vehicleRepository;
        this.userRepository = userRepository;
    }

    public RideDtos.RideResponse toResponse(Ride ride) {
        Driver driver = driverRepository.findById(ride.getDriverId()).orElse(null);
        User driverUser = driver != null ? userRepository.findById(driver.getUserId()).orElse(null) : null;
        Vehicle vehicle = vehicleRepository.findById(ride.getVehicleId()).orElse(null);
        boolean verified = driver != null && driver.getStatus() == DriverStatus.APPROVED
                && driver.isLicenseVerified() && vehicle != null && vehicle.isVerified();
        String model = vehicle == null ? "Vehicle" :
                ((vehicle.getMake() == null ? "" : vehicle.getMake() + " ")
                        + (vehicle.getModel() == null ? "" : vehicle.getModel())).trim();
        return new RideDtos.RideResponse(ride.getId(), ride.getDriverId(),
                driverUser != null ? driverUser.getFullName() : "ZEVORA Driver",
                driver != null ? driver.getRating() : BigDecimal.valueOf(5),
                verified, driver != null ? driver.getDriverType() : null,
                ride.getVehicleId(), model,
                vehicle != null ? vehicle.getPlateNumber() : "—",
                ride.getOriginAddress(), ride.getOriginLat(), ride.getOriginLng(),
                ride.getDestAddress(), ride.getDestLat(), ride.getDestLng(),
                ride.getDepartureTime(), ride.getTotalSeats(), ride.getAvailableSeats(),
                ride.getPricePerSeat(), ride.getStatus(), ride.isWomenOnly(),
                ride.isRecurring(), ride.getNotes(), ride.getCreatedAt());
    }
}
