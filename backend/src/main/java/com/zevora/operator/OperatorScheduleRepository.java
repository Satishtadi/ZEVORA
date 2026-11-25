package com.zevora.operator;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface OperatorScheduleRepository extends JpaRepository<OperatorSchedule, UUID> {
    List<OperatorSchedule> findByRouteIdAndActiveTrueOrderByDepartureTimeAsc(UUID routeId);
    List<OperatorSchedule> findByRouteIdOrderByDepartureTimeAsc(UUID routeId);
}
