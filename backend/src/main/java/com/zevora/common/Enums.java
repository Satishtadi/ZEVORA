package com.zevora.common;

public final class Enums {
    private Enums() {}

    public enum Role {
        PASSENGER, PRIVATE_CARPOOL_DRIVER, COMMERCIAL_DRIVER,
        OPERATOR_ADMIN, CORPORATE_ADMIN, SUPPORT_AGENT, PLATFORM_ADMIN, SUPER_ADMIN
    }

    public enum UserStatus { ACTIVE, SUSPENDED, DELETED }
    public enum DriverType { PRIVATE_CARPOOL, COMMERCIAL }
    public enum DriverStatus { PENDING, APPROVED, REJECTED, SUSPENDED }
    public enum RideStatus { DRAFT, PUBLISHED, FULL, IN_PROGRESS, COMPLETED, CANCELLED }
    public enum BookingStatus { REQUESTED, CONFIRMED, IN_PROGRESS, COMPLETED, CANCELLED }
    public enum PaymentStatus { PENDING, PAID, REFUNDED, FAILED }
    public enum PaymentTxnStatus { CREATED, SUCCESS, FAILED, REFUNDED }
    public enum SubscriptionPlan { BASIC_PLUS, PREMIUM }
    public enum SubscriptionStatus { ACTIVE, CANCELLED, EXPIRED }
    public enum SafetyType { SOS, INCIDENT }
    public enum SafetyStatus { OPEN, ACKNOWLEDGED, RESOLVED }
    public enum ProviderType { PRIVATE_CARPOOL, COMMERCIAL_SHARED_CAB, PUBLIC_BUS, METRO_FEEDER, COMPANY_SHUTTLE, AUTO, CAB, EXTERNAL_CAB }
    public enum DataQuality { LIVE, ESTIMATED, EXTERNAL }
    public enum CommutePreference { CHEAPEST, FASTEST, MOST_RELIABLE, BALANCED }
    public enum NotificationType { BOOKING, CANCELLATION, SAFETY, SYSTEM, PAYMENT, VERIFICATION }
    public enum CompanyStatus { ACTIVE, PENDING, SUSPENDED }
    public enum OperatorStatus { ACTIVE, PENDING, SUSPENDED }
    public enum PricingType { PRIVATE_CARPOOL, COMMERCIAL_CAB, AUTO, CAB, PLATFORM }
    public enum OtpPurpose { LOGIN, VERIFY_PHONE, RESET_PASSWORD }
}
