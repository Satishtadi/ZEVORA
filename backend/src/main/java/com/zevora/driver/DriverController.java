package com.zevora.driver;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1")
public class DriverController {
    private final DriverService driverService;

    public DriverController(DriverService driverService) {
        this.driverService = driverService;
    }

    @PostMapping("/drivers/register")
    @ResponseStatus(HttpStatus.CREATED)
    public DriverDtos.DriverResponse register(@Valid @RequestBody DriverDtos.RegisterDriverRequest request) {
        return driverService.register(request);
    }

    @GetMapping("/drivers/profile")
    public DriverDtos.DriverResponse profile() {
        return driverService.profile();
    }

    @PutMapping("/drivers/availability")
    public DriverDtos.DriverResponse availability(@Valid @RequestBody DriverDtos.AvailabilityRequest request) {
        return driverService.setAvailability(request);
    }

    @GetMapping("/vehicles")
    public List<DriverDtos.VehicleResponse> vehicles() {
        return driverService.vehicles();
    }

    @PostMapping("/vehicles")
    @ResponseStatus(HttpStatus.CREATED)
    public DriverDtos.VehicleResponse addVehicle(@Valid @RequestBody DriverDtos.VehicleRequest request) {
        return driverService.addVehicle(request);
    }

    @PutMapping("/vehicles/{id}")
    public DriverDtos.VehicleResponse updateVehicle(@PathVariable UUID id,
                                                    @Valid @RequestBody DriverDtos.VehicleRequest request) {
        return driverService.updateVehicle(id, request);
    }
}
