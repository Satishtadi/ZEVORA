package com.zevora.review;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/reviews")
public class ReviewController {
    private final ReviewService reviewService;

    public ReviewController(ReviewService reviewService) {
        this.reviewService = reviewService;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ReviewDtos.ReviewResponse create(@Valid @RequestBody ReviewDtos.ReviewRequest request) {
        return reviewService.create(request);
    }

    @GetMapping("/booking/{bookingId}")
    public ReviewDtos.ReviewResponse forBooking(@PathVariable UUID bookingId) {
        return reviewService.forBooking(bookingId);
    }
}
