package com.zevora.corporate;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/corporate")
public class CorporateController {
    private final CorporateService service;

    public CorporateController(CorporateService service) {
        this.service = service;
    }

    @PostMapping("/companies")
    @ResponseStatus(HttpStatus.CREATED)
    public CorporateDtos.CompanyResponse createCompany(@Valid @RequestBody CorporateDtos.CreateCompanyRequest request) {
        return service.createCompany(request);
    }

    @GetMapping("/companies")
    public List<CorporateDtos.CompanyResponse> companies() {
        return service.companies();
    }

    @GetMapping("/companies/{companyId}/employees")
    public List<CorporateDtos.EmployeeResponse> employees(@PathVariable UUID companyId) {
        return service.employees(companyId);
    }

    @PostMapping("/companies/{companyId}/employees")
    @ResponseStatus(HttpStatus.CREATED)
    public CorporateDtos.EmployeeResponse addEmployee(@PathVariable UUID companyId,
                                                      @Valid @RequestBody CorporateDtos.AddEmployeeRequest request) {
        return service.addEmployee(companyId, request);
    }

    @PutMapping("/companies/{companyId}/employees/{employeeId}/verify")
    public CorporateDtos.EmployeeResponse verifyEmployee(@PathVariable UUID companyId, @PathVariable UUID employeeId,
                                                         @RequestParam boolean verified) {
        return service.verifyEmployee(companyId, employeeId, verified);
    }

    @GetMapping("/companies/{companyId}/locations")
    public List<CorporateDtos.LocationResponse> locations(@PathVariable UUID companyId) {
        return service.locations(companyId);
    }

    @PostMapping("/companies/{companyId}/locations")
    @ResponseStatus(HttpStatus.CREATED)
    public CorporateDtos.LocationResponse addLocation(@PathVariable UUID companyId,
                                                      @Valid @RequestBody CorporateDtos.LocationRequest request) {
        return service.addLocation(companyId, request);
    }

    @GetMapping("/companies/{companyId}/shuttles")
    public List<CorporateDtos.ShuttleResponse> shuttles(@PathVariable UUID companyId) {
        return service.shuttles(companyId);
    }

    @PostMapping("/companies/{companyId}/shuttles")
    @ResponseStatus(HttpStatus.CREATED)
    public CorporateDtos.ShuttleResponse addShuttle(@PathVariable UUID companyId,
                                                    @Valid @RequestBody CorporateDtos.ShuttleRequest request) {
        return service.addShuttle(companyId, request);
    }

    @GetMapping("/companies/{companyId}/reports")
    public CorporateDtos.ReportResponse report(@PathVariable UUID companyId) {
        return service.report(companyId);
    }
}
