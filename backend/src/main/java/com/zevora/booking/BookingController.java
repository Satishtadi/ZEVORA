package com.zevora.booking;

import com.zevora.common.PageResponse;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/bookings")
public class BookingController {
    private final BookingService bookingService;

    public BookingController(BookingService bookingService) {
        this.bookingService = bookingService;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public BookingDtos.BookingResponse book(@Valid @RequestBody BookingDtos.CreateBookingRequest request) {
        return bookingService.book(request);
    }

    @GetMapping
    public PageResponse<BookingDtos.BookingResponse> mine(@RequestParam(defaultValue = "0") int page,
                                                          @RequestParam(defaultValue = "20") int size) {
        return bookingService.mine(page, size);
    }

    @GetMapping("/{id}")
    public BookingDtos.BookingResponse get(@PathVariable UUID id) {
        return bookingService.get(id);
    }

    @PostMapping("/{id}/cancel")
    public BookingDtos.CancelResponse cancel(@PathVariable UUID id,
                                             @RequestBody(required = false) BookingDtos.CancelBookingRequest request) {
        return bookingService.cancel(id, request == null ? null : request.reason());
    }

    @GetMapping("/{id}/alternatives")
    public List<BookingDtos.AlternativeOption> alternatives(@PathVariable UUID id) {
        return bookingService.alternatives(id);
    }

    @GetMapping("/{id}/history")
    public List<BookingDtos.BookingHistoryEntry> history(@PathVariable UUID id) {
        return bookingService.history(id);
    }

    @GetMapping("/ride/{rideId}")
    public List<BookingDtos.BookingResponse> forRide(@PathVariable UUID rideId) {
        return bookingService.forRide(rideId);
    }
}
