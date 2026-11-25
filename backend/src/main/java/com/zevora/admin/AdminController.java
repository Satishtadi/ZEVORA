package com.zevora.admin;

import com.zevora.booking.BookingDtos;
import com.zevora.common.Enums.BookingStatus;
import com.zevora.common.Enums.DriverStatus;
import com.zevora.common.Enums.SafetyStatus;
import com.zevora.common.PageResponse;
import com.zevora.driver.DriverDtos;
import com.zevora.pricing.PricingRule;
import com.zevora.safety.SafetyDtos;
import com.zevora.settings.SystemSetting;
import com.zevora.user.UserDtos;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/admin")
public class AdminController {
    private final AdminService service;

    public AdminController(AdminService service) {
        this.service = service;
    }

    @GetMapping("/dashboard")
    public AdminDtos.DashboardResponse dashboard() {
        return service.dashboard();
    }

    @GetMapping("/users")
    public PageResponse<UserDtos.Summary> users(@RequestParam(required = false) String q,
                                                @RequestParam(defaultValue = "0") int page,
                                                @RequestParam(defaultValue = "20") int size) {
        return service.users(q, page, size);
    }

    @PutMapping("/users/{id}/status")
    public UserDtos.Summary userStatus(@PathVariable UUID id,
                                       @Valid @RequestBody AdminDtos.UserStatusRequest request) {
        return service.setUserStatus(id, request);
    }

    @GetMapping("/drivers")
    public PageResponse<DriverDtos.DriverResponse> drivers(@RequestParam(required = false) DriverStatus status,
                                                           @RequestParam(defaultValue = "0") int page,
                                                           @RequestParam(defaultValue = "20") int size) {
        return service.drivers(status, page, size);
    }

    @PostMapping("/drivers/{id}/verify")
    public DriverDtos.DriverResponse verifyDriver(@PathVariable UUID id,
                                                  @Valid @RequestBody AdminDtos.VerifyDriverRequest request) {
        return service.verifyDriver(id, request);
    }

    @PostMapping("/vehicles/{id}/verify")
    public DriverDtos.VehicleResponse verifyVehicle(@PathVariable UUID id,
                                                    @Valid @RequestBody AdminDtos.VerifyVehicleRequest request) {
        return service.verifyVehicle(id, request.approved());
    }

    @GetMapping("/bookings")
    public PageResponse<BookingDtos.BookingResponse> bookings(@RequestParam(required = false) BookingStatus status,
                                                              @RequestParam(defaultValue = "0") int page,
                                                              @RequestParam(defaultValue = "20") int size) {
        return service.bookings(status, page, size);
    }

    @GetMapping("/safety")
    public PageResponse<SafetyDtos.EventResponse> safety(@RequestParam(required = false) SafetyStatus status,
                                                         @RequestParam(defaultValue = "0") int page,
                                                         @RequestParam(defaultValue = "20") int size) {
        return service.safetyEvents(status, page, size);
    }

    @PutMapping("/safety/{id}/status")
    public SafetyDtos.EventResponse resolveSafety(@PathVariable UUID id, @RequestParam SafetyStatus status) {
        return service.resolveSafety(id, status);
    }

    @GetMapping("/settings")
    public List<SystemSetting> settings() {
        return service.settings();
    }

    @PutMapping("/settings/{key}")
    public SystemSetting updateSetting(@PathVariable String key,
                                       @Valid @RequestBody AdminDtos.SettingUpdateRequest request) {
        return service.updateSetting(key, request);
    }

    @GetMapping("/pricing-rules")
    public List<PricingRule> pricingRules() {
        return service.pricingRules();
    }

    @PutMapping("/pricing-rules/{id}")
    public PricingRule updatePricing(@PathVariable UUID id,
                                     @Valid @RequestBody AdminDtos.PricingUpdateRequest request) {
        return service.updatePricing(id, request);
    }

    @GetMapping("/reports")
    public AdminDtos.ReportsResponse reports() {
        return service.reports();
    }

    @GetMapping("/audit-logs")
    public PageResponse<AuditLog> auditLogs(@RequestParam(defaultValue = "0") int page,
                                            @RequestParam(defaultValue = "20") int size) {
        return service.auditLogs(page, size);
    }
}
