package com.zevora.admin;

import jakarta.validation.constraints.*;

import java.math.BigDecimal;
import java.util.List;

public final class AdminDtos {
    private AdminDtos() {}

    public record DayCount(String date, long count) {}

    public record DashboardResponse(
            long totalUsers, long totalDrivers, long activeDrivers, long completedRides,
            long cancelledRides, long activeBookings, long pendingDriverVerifications,
            BigDecimal revenueLast30Days, long openSafetyIncidents, List<DayCount> bookingTrend
    ) {}

    public record VerifyDriverRequest(@NotNull Boolean approved, @Size(max = 255) String note) {}
    public record VerifyVehicleRequest(@NotNull Boolean approved) {}
    public record UserStatusRequest(@NotNull Boolean suspend, @Size(max = 255) String reason) {}

    public record SettingUpdateRequest(@NotBlank String value, @Size(max = 255) String description) {}

    public record PricingUpdateRequest(
            @NotBlank String name,
            @NotNull @DecimalMin("0.0") BigDecimal baseFare,
            @NotNull @DecimalMin("0.0") BigDecimal perKm,
            @NotNull @DecimalMin("0.0") BigDecimal perMinute,
            @NotNull @DecimalMin("0.0") BigDecimal platformFeePct,
            @DecimalMin("0.0") BigDecimal minFare,
            boolean active
    ) {}

    public record ReportsResponse(
            long totalRides, long totalBookings, long completedBookings, long cancelledBookings,
            double cancellationRatePercent, BigDecimal revenueCollected,
            long refundCount, BigDecimal refundedAmount, long safetyIncidents, long activeSubscriptions
    ) {}
}
