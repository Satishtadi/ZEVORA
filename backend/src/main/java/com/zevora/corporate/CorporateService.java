package com.zevora.corporate;

import com.zevora.common.ApiException;
import com.zevora.common.Enums.CompanyStatus;
import com.zevora.user.User;
import com.zevora.user.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Service
public class CorporateService {
    private final CompanyRepository companyRepository;
    private final CompanyEmployeeRepository employeeRepository;
    private final CorporateLocationRepository locationRepository;
    private final CompanyShuttleRepository shuttleRepository;
    private final UserRepository userRepository;

    public CorporateService(CompanyRepository companyRepository, CompanyEmployeeRepository employeeRepository,
                            CorporateLocationRepository locationRepository, CompanyShuttleRepository shuttleRepository,
                            UserRepository userRepository) {
        this.companyRepository = companyRepository;
        this.employeeRepository = employeeRepository;
        this.locationRepository = locationRepository;
        this.shuttleRepository = shuttleRepository;
        this.userRepository = userRepository;
    }

    @Transactional
    public CorporateDtos.CompanyResponse createCompany(CorporateDtos.CreateCompanyRequest req) {
        String domain = req.domain().trim().toLowerCase();
        if (companyRepository.findByDomainIgnoreCase(domain).isPresent()) {
            throw ApiException.conflict("COMPANY_EXISTS", "A company with this domain already exists");
        }
        Company company = companyRepository.save(Company.builder()
                .name(req.name().trim())
                .domain(domain)
                .contactEmail(req.contactEmail())
                .status(CompanyStatus.ACTIVE)
                .build());
        return CorporateDtos.CompanyResponse.from(company);
    }

    @Transactional(readOnly = true)
    public List<CorporateDtos.CompanyResponse> companies() {
        return companyRepository.findAll().stream().map(CorporateDtos.CompanyResponse::from).toList();
    }

    private Company requireCompany(UUID id) {
        return companyRepository.findById(id)
                .orElseThrow(() -> ApiException.notFound("COMPANY_NOT_FOUND", "Company not found"));
    }

    @Transactional(readOnly = true)
    public List<CorporateDtos.EmployeeResponse> employees(UUID companyId) {
        requireCompany(companyId);
        return employeeRepository.findByCompanyIdOrderByCreatedAtDesc(companyId).stream().map(e -> {
            User user = userRepository.findById(e.getUserId()).orElse(null);
            return new CorporateDtos.EmployeeResponse(e.getId(), e.getUserId(),
                    user != null ? user.getFullName() : "Employee",
                    user != null ? user.getEmail() : null,
                    user != null ? user.getPhone() : null,
                    e.getEmployeeCode(), e.getDepartment(), e.getOfficeAddress(), e.isVerified());
        }).toList();
    }

    @Transactional
    public CorporateDtos.EmployeeResponse addEmployee(UUID companyId, CorporateDtos.AddEmployeeRequest req) {
        requireCompany(companyId);
        User user = userRepository.findByEmailIgnoreCase(req.email().trim())
                .orElseThrow(() -> ApiException.notFound("USER_NOT_FOUND", "No ZEVORA account with this email. Ask the employee to register first."));
        if (employeeRepository.findByCompanyIdAndUserId(companyId, user.getId()).isPresent()) {
            throw ApiException.conflict("EMPLOYEE_EXISTS", "This employee is already linked to the company");
        }
        CompanyEmployee employee = employeeRepository.save(CompanyEmployee.builder()
                .companyId(companyId)
                .userId(user.getId())
                .employeeCode(req.employeeCode())
                .department(req.department())
                .officeAddress(req.officeAddress())
                .officeLat(req.officeLat())
                .officeLng(req.officeLng())
                .verified(false)
                .build());
        return new CorporateDtos.EmployeeResponse(employee.getId(), user.getId(), user.getFullName(),
                user.getEmail(), user.getPhone(), employee.getEmployeeCode(), employee.getDepartment(),
                employee.getOfficeAddress(), employee.isVerified());
    }

    @Transactional
    public CorporateDtos.EmployeeResponse verifyEmployee(UUID companyId, UUID employeeId, boolean verified) {
        CompanyEmployee employee = employeeRepository.findById(employeeId)
                .filter(e -> e.getCompanyId().equals(companyId))
                .orElseThrow(() -> ApiException.notFound("EMPLOYEE_NOT_FOUND", "Employee not found"));
        employee.setVerified(verified);
        employeeRepository.save(employee);
        User user = userRepository.findById(employee.getUserId()).orElse(null);
        return new CorporateDtos.EmployeeResponse(employee.getId(), employee.getUserId(),
                user != null ? user.getFullName() : "Employee",
                user != null ? user.getEmail() : null, user != null ? user.getPhone() : null,
                employee.getEmployeeCode(), employee.getDepartment(), employee.getOfficeAddress(), employee.isVerified());
    }

    @Transactional(readOnly = true)
    public List<CorporateDtos.LocationResponse> locations(UUID companyId) {
        requireCompany(companyId);
        return locationRepository.findByCompanyId(companyId).stream()
                .map(CorporateDtos.LocationResponse::from).toList();
    }

    @Transactional
    public CorporateDtos.LocationResponse addLocation(UUID companyId, CorporateDtos.LocationRequest req) {
        requireCompany(companyId);
        return CorporateDtos.LocationResponse.from(locationRepository.save(CorporateLocation.builder()
                .companyId(companyId).name(req.name()).address(req.address())
                .latitude(req.latitude()).longitude(req.longitude()).build()));
    }

    @Transactional(readOnly = true)
    public List<CorporateDtos.ShuttleResponse> shuttles(UUID companyId) {
        requireCompany(companyId);
        return shuttleRepository.findByCompanyIdOrderByDepartureTimeAsc(companyId).stream()
                .map(CorporateDtos.ShuttleResponse::from).toList();
    }

    @Transactional
    public CorporateDtos.ShuttleResponse addShuttle(UUID companyId, CorporateDtos.ShuttleRequest req) {
        requireCompany(companyId);
        if (req.availableSeats() > req.seatCapacity()) {
            throw ApiException.badRequest("SEATS_INVALID", "Available seats cannot exceed capacity");
        }
        return CorporateDtos.ShuttleResponse.from(shuttleRepository.save(CompanyShuttle.builder()
                .companyId(companyId).name(req.name()).routeName(req.routeName())
                .originAddress(req.originAddress()).originLat(req.originLat()).originLng(req.originLng())
                .destAddress(req.destAddress()).destLat(req.destLat()).destLng(req.destLng())
                .departureTime(req.departureTime()).daysOfWeek(req.daysOfWeek())
                .seatCapacity(req.seatCapacity()).availableSeats(req.availableSeats())
                .fare(req.fare()).active(req.active()).build()));
    }

    @Transactional(readOnly = true)
    public CorporateDtos.ReportResponse report(UUID companyId) {
        requireCompany(companyId);
        List<CompanyShuttle> shuttles = shuttleRepository.findByCompanyIdOrderByDepartureTimeAsc(companyId);
        int seats = shuttles.stream().mapToInt(CompanyShuttle::getSeatCapacity).sum();
        BigDecimal spend = shuttles.stream()
                .map(s -> (s.getFare() == null ? BigDecimal.ZERO : s.getFare())
                        .multiply(BigDecimal.valueOf(s.getAvailableSeats()))
                        .multiply(BigDecimal.valueOf(22)))
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        return new CorporateDtos.ReportResponse(companyId,
                employeeRepository.findByCompanyIdOrderByCreatedAtDesc(companyId).size(),
                employeeRepository.countByCompanyIdAndVerifiedTrue(companyId),
                shuttles.size(), locationRepository.findByCompanyId(companyId).size(), seats, spend,
                "Estimated monthly shuttle spend assumes 22 working days and currently available seats. Actual billing depends on completed trips.");
    }
}
