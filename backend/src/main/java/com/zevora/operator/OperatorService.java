package com.zevora.operator;

import com.zevora.common.ApiException;
import com.zevora.common.Enums.OperatorStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Service
public class OperatorService {
    private final TransportOperatorRepository operatorRepository;
    private final OperatorRouteRepository routeRepository;
    private final OperatorScheduleRepository scheduleRepository;
    private final OperatorVehicleRepository vehicleRepository;
    private final OperatorDriverRepository driverRepository;

    public OperatorService(TransportOperatorRepository operatorRepository, OperatorRouteRepository routeRepository,
                           OperatorScheduleRepository scheduleRepository, OperatorVehicleRepository vehicleRepository,
                           OperatorDriverRepository driverRepository) {
        this.operatorRepository = operatorRepository;
        this.routeRepository = routeRepository;
        this.scheduleRepository = scheduleRepository;
        this.vehicleRepository = vehicleRepository;
        this.driverRepository = driverRepository;
    }

    @Transactional
    public OperatorDtos.OperatorResponse create(OperatorDtos.CreateOperatorRequest req) {
        return OperatorDtos.OperatorResponse.from(operatorRepository.save(TransportOperator.builder()
                .name(req.name().trim()).contactEmail(req.contactEmail())
                .status(OperatorStatus.PENDING).verified(false).build()));
    }

    @Transactional(readOnly = true)
    public List<OperatorDtos.OperatorResponse> operators() {
        return operatorRepository.findAll().stream().map(OperatorDtos.OperatorResponse::from).toList();
    }

    private TransportOperator requireOperator(UUID id) {
        return operatorRepository.findById(id)
                .orElseThrow(() -> ApiException.notFound("OPERATOR_NOT_FOUND", "Operator not found"));
    }

    @Transactional(readOnly = true)
    public List<OperatorDtos.RouteResponse> routes(UUID operatorId) {
        requireOperator(operatorId);
        return routeRepository.findByOperatorIdOrderByCreatedAtDesc(operatorId).stream()
                .map(OperatorDtos.RouteResponse::from).toList();
    }

    @Transactional
    public OperatorDtos.RouteResponse addRoute(UUID operatorId, OperatorDtos.RouteRequest req) {
        requireOperator(operatorId);
        return OperatorDtos.RouteResponse.from(routeRepository.save(OperatorRoute.builder()
                .operatorId(operatorId).name(req.name())
                .originAddress(req.originAddress()).originLat(req.originLat()).originLng(req.originLng())
                .destAddress(req.destAddress()).destLat(req.destLat()).destLng(req.destLng())
                .baseFare(req.baseFare()).perKm(req.perKm()).active(req.active()).build()));
    }

    @Transactional(readOnly = true)
    public List<OperatorDtos.ScheduleResponse> schedules(UUID routeId) {
        return scheduleRepository.findByRouteIdOrderByDepartureTimeAsc(routeId).stream()
                .map(OperatorDtos.ScheduleResponse::from).toList();
    }

    @Transactional
    public OperatorDtos.ScheduleResponse addSchedule(UUID routeId, OperatorDtos.ScheduleRequest req) {
        if (req.availableSeats() > req.seatCapacity()) {
            throw ApiException.badRequest("SEATS_INVALID", "Available seats cannot exceed capacity");
        }
        return OperatorDtos.ScheduleResponse.from(scheduleRepository.save(OperatorSchedule.builder()
                .routeId(routeId).departureTime(req.departureTime()).daysOfWeek(req.daysOfWeek())
                .seatCapacity(req.seatCapacity()).availableSeats(req.availableSeats())
                .fare(req.fare()).active(req.active()).build()));
    }

    @Transactional
    public OperatorDtos.OperatorVehicleResponse addVehicle(UUID operatorId, OperatorDtos.VehicleRequest req) {
        requireOperator(operatorId);
        return OperatorDtos.OperatorVehicleResponse.from(vehicleRepository.save(OperatorVehicle.builder()
                .operatorId(operatorId).plateNumber(req.plateNumber().toUpperCase().replaceAll("\\s", ""))
                .model(req.model()).seatCapacity(req.seatCapacity()).verified(req.verified()).build()));
    }

    @Transactional
    public OperatorDtos.OperatorDriverResponse addDriver(UUID operatorId, OperatorDtos.DriverRequest req) {
        requireOperator(operatorId);
        return OperatorDtos.OperatorDriverResponse.from(driverRepository.save(OperatorDriver.builder()
                .operatorId(operatorId).fullName(req.fullName()).phone(req.phone())
                .licenseNumber(req.licenseNumber()).verified(req.verified()).build()));
    }

    @Transactional(readOnly = true)
    public OperatorDtos.FleetResponse fleet(UUID operatorId) {
        requireOperator(operatorId);
        return new OperatorDtos.FleetResponse(
                vehicleRepository.findByOperatorId(operatorId).stream().map(OperatorDtos.OperatorVehicleResponse::from).toList(),
                driverRepository.findByOperatorId(operatorId).stream().map(OperatorDtos.OperatorDriverResponse::from).toList());
    }

    @Transactional(readOnly = true)
    public OperatorDtos.SummaryResponse summary(UUID operatorId) {
        TransportOperator operator = requireOperator(operatorId);
        List<OperatorRoute> routes = routeRepository.findByOperatorIdOrderByCreatedAtDesc(operatorId);
        int dailySeats = 0;
        BigDecimal revenue = BigDecimal.ZERO;
        long scheduleCount = 0;
        for (OperatorRoute route : routes) {
            for (OperatorSchedule schedule : scheduleRepository.findByRouteIdOrderByDepartureTimeAsc(route.getId())) {
                scheduleCount++;
                dailySeats += schedule.getAvailableSeats();
                BigDecimal fare = schedule.getFare() == null ? BigDecimal.ZERO : schedule.getFare();
                revenue = revenue.add(fare.multiply(BigDecimal.valueOf(schedule.getAvailableSeats()))
                        .multiply(BigDecimal.valueOf(22)));
            }
        }
        return new OperatorDtos.SummaryResponse(operatorId, operator.getName(), routes.size(), scheduleCount,
                vehicleRepository.findByOperatorId(operatorId).size(),
                driverRepository.findByOperatorId(operatorId).size(), dailySeats, revenue,
                "Estimated monthly revenue assumes 22 working days and fully occupied scheduled seats. Actual settlement uses completed trips.");
    }
}
