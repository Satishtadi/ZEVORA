package com.zevora.corporate;

import com.zevora.common.Enums.CompanyStatus;
import jakarta.validation.constraints.*;

import java.math.BigDecimal;
import java.time.LocalTime;
import java.util.UUID;

public final class CorporateDtos {
    private CorporateDtos() {}

    public record CreateCompanyRequest(
            @NotBlank @Size(max = 150) String name,
            @NotBlank @Size(max = 120) String domain,
            @Email @Size(max = 180) String contactEmail
    ) {}

    public record CompanyResponse(UUID id, String name, String domain, String contactEmail, CompanyStatus status) {
        public static CompanyResponse from(Company c) {
            return new CompanyResponse(c.getId(), c.getName(), c.getDomain(), c.getContactEmail(), c.getStatus());
        }
    }

    public record AddEmployeeRequest(
            @NotBlank @Email String email,
            @Size(max = 40) String employeeCode,
            @Size(max = 80) String department,
            @Size(max = 255) String officeAddress,
            @DecimalMin("-90.0") @DecimalMax("90.0") Double officeLat,
            @DecimalMin("-180.0") @DecimalMax("180.0") Double officeLng
    ) {}

    public record EmployeeResponse(UUID id, UUID userId, String fullName, String email, String phone,
                                   String employeeCode, String department, String officeAddress, boolean verified) {}

    public record LocationRequest(
            @NotBlank @Size(max = 120) String name,
            @Size(max = 255) String address,
            @DecimalMin("-90.0") @DecimalMax("90.0") Double latitude,
            @DecimalMin("-180.0") @DecimalMax("180.0") Double longitude
    ) {}

    public record LocationResponse(UUID id, String name, String address, Double latitude, Double longitude) {
        public static LocationResponse from(CorporateLocation l) {
            return new LocationResponse(l.getId(), l.getName(), l.getAddress(), l.getLatitude(), l.getLongitude());
        }
    }

    public record ShuttleRequest(
            @NotBlank @Size(max = 120) String name,
            @Size(max = 150) String routeName,
            @Size(max = 255) String originAddress,
            @DecimalMin("-90.0") @DecimalMax("90.0") Double originLat,
            @DecimalMin("-180.0") @DecimalMax("180.0") Double originLng,
            @Size(max = 255) String destAddress,
            @DecimalMin("-90.0") @DecimalMax("90.0") Double destLat,
            @DecimalMin("-180.0") @DecimalMax("180.0") Double destLng,
            @NotNull LocalTime departureTime,
            @Size(max = 30) String daysOfWeek,
            @Min(1) int seatCapacity,
            @Min(0) int availableSeats,
            @DecimalMin("0.0") BigDecimal fare,
            boolean active
    ) {}

    public record ShuttleResponse(UUID id, String name, String routeName, String originAddress, String destAddress,
                                  LocalTime departureTime, String daysOfWeek, int seatCapacity,
                                  int availableSeats, BigDecimal fare, boolean active) {
        public static ShuttleResponse from(CompanyShuttle s) {
            return new ShuttleResponse(s.getId(), s.getName(), s.getRouteName(), s.getOriginAddress(),
                    s.getDestAddress(), s.getDepartureTime(), s.getDaysOfWeek(), s.getSeatCapacity(),
                    s.getAvailableSeats(), s.getFare(), s.isActive());
        }
    }

    public record ReportResponse(UUID companyId, long employees, long verifiedEmployees, long shuttles,
                                 long locations, int totalShuttleSeats, BigDecimal estimatedMonthlyTransportSpend,
                                 String note) {}
}
