package com.zevora.review;

import com.zevora.booking.Booking;
import com.zevora.booking.BookingRepository;
import com.zevora.common.ApiException;
import com.zevora.common.Enums.BookingStatus;
import com.zevora.driver.Driver;
import com.zevora.driver.DriverRepository;
import com.zevora.ride.Ride;
import com.zevora.ride.RideRepository;
import com.zevora.security.SecurityUtils;
import com.zevora.user.User;
import com.zevora.user.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.util.UUID;

@Service
public class ReviewService {
    private final ReviewRepository reviewRepository;
    private final BookingRepository bookingRepository;
    private final RideRepository rideRepository;
    private final DriverRepository driverRepository;
    private final UserRepository userRepository;

    public ReviewService(ReviewRepository reviewRepository, BookingRepository bookingRepository,
                         RideRepository rideRepository, DriverRepository driverRepository,
                         UserRepository userRepository) {
        this.reviewRepository = reviewRepository;
        this.bookingRepository = bookingRepository;
        this.rideRepository = rideRepository;
        this.driverRepository = driverRepository;
        this.userRepository = userRepository;
    }

    @Transactional
    public ReviewDtos.ReviewResponse create(ReviewDtos.ReviewRequest req) {
        UUID from = SecurityUtils.userId();
        Booking booking = bookingRepository.findById(req.bookingId())
                .orElseThrow(() -> ApiException.notFound("BOOKING_NOT_FOUND", "Booking not found"));
        if (booking.getStatus() != BookingStatus.COMPLETED) {
            throw ApiException.badRequest("TRIP_NOT_COMPLETED", "You can review only completed trips");
        }
        Ride ride = rideRepository.findById(booking.getRideId())
                .orElseThrow(() -> ApiException.notFound("RIDE_NOT_FOUND", "Ride not found"));
        Driver driver = driverRepository.findById(ride.getDriverId())
                .orElseThrow(() -> ApiException.notFound("DRIVER_NOT_FOUND", "Driver not found"));

        UUID to;
        if (from.equals(booking.getPassengerId())) {
            to = driver.getUserId();
        } else if (from.equals(driver.getUserId())) {
            to = booking.getPassengerId();
        } else {
            throw ApiException.forbidden("NOT_PARTICIPANT", "You were not part of this trip");
        }
        if (reviewRepository.existsByBookingIdAndFromUserId(booking.getId(), from)) {
            throw ApiException.conflict("ALREADY_REVIEWED", "You already reviewed this trip");
        }
        Review review = reviewRepository.save(Review.builder()
                .bookingId(booking.getId())
                .fromUserId(from)
                .toUserId(to)
                .rating(req.rating())
                .comment(req.comment())
                .build());

        Double average = reviewRepository.averageRatingFor(to);
        if (average != null) {
            driverRepository.findByUserId(to).ifPresent(d -> {
                d.setRating(BigDecimal.valueOf(average).setScale(2, RoundingMode.HALF_UP));
                driverRepository.save(d);
            });
        }
        User toUser = userRepository.findById(to).orElse(null);
        return new ReviewDtos.ReviewResponse(review.getId(), booking.getId(), review.getRating(),
                review.getComment(), toUser != null ? toUser.getFullName() : "User", review.getCreatedAt());
    }

    @Transactional(readOnly = true)
    public ReviewDtos.ReviewResponse forBooking(UUID bookingId) {
        UUID from = SecurityUtils.userId();
        return reviewRepository.findByBookingIdAndFromUserId(bookingId, from)
                .map(r -> new ReviewDtos.ReviewResponse(r.getId(), r.getBookingId(), r.getRating(),
                        r.getComment(), null, r.getCreatedAt()))
                .orElse(null);
    }
}
