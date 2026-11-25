package com.zevora.operator;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/operator")
public class OperatorController {
    private final OperatorService service;

    public OperatorController(OperatorService service) {
        this.service = service;
    }

    @PostMapping("/operators")
    @ResponseStatus(HttpStatus.CREATED)
    public OperatorDtos.OperatorResponse create(@Valid @RequestBody OperatorDtos.CreateOperatorRequest request) {
        return service.create(request);
    }

    @GetMapping("/operators")
    public List<OperatorDtos.OperatorResponse> operators() {
        return service.operators();
    }

    @GetMapping("/operators/{operatorId}/routes")
    public List<OperatorDtos.RouteResponse> routes(@PathVariable UUID operatorId) {
        return service.routes(operatorId);
    }

    @PostMapping("/operators/{operatorId}/routes")
    @ResponseStatus(HttpStatus.CREATED)
    public OperatorDtos.RouteResponse addRoute(@PathVariable UUID operatorId,
                                               @Valid @RequestBody OperatorDtos.RouteRequest request) {
        return service.addRoute(operatorId, request);
    }

    @GetMapping("/routes/{routeId}/schedules")
    public List<OperatorDtos.ScheduleResponse> schedules(@PathVariable UUID routeId) {
        return service.schedules(routeId);
    }

    @PostMapping("/routes/{routeId}/schedules")
    @ResponseStatus(HttpStatus.CREATED)
    public OperatorDtos.ScheduleResponse addSchedule(@PathVariable UUID routeId,
                                                     @Valid @RequestBody OperatorDtos.ScheduleRequest request) {
        return service.addSchedule(routeId, request);
    }

    @GetMapping("/operators/{operatorId}/fleet")
    public OperatorDtos.FleetResponse fleet(@PathVariable UUID operatorId) {
        return service.fleet(operatorId);
    }

    @PostMapping("/operators/{operatorId}/vehicles")
    @ResponseStatus(HttpStatus.CREATED)
    public OperatorDtos.OperatorVehicleResponse addVehicle(@PathVariable UUID operatorId,
                                                           @Valid @RequestBody OperatorDtos.VehicleRequest request) {
        return service.addVehicle(operatorId, request);
    }

    @PostMapping("/operators/{operatorId}/drivers")
    @ResponseStatus(HttpStatus.CREATED)
    public OperatorDtos.OperatorDriverResponse addDriver(@PathVariable UUID operatorId,
                                                         @Valid @RequestBody OperatorDtos.DriverRequest request) {
        return service.addDriver(operatorId, request);
    }

    @GetMapping("/operators/{operatorId}/summary")
    public OperatorDtos.SummaryResponse summary(@PathVariable UUID operatorId) {
        return service.summary(operatorId);
    }
}
