package com.zevora.review;

import jakarta.validation.constraints.*;

import java.time.Instant;
import java.util.UUID;

public final class ReviewDtos {
    private ReviewDtos() {}

    public record ReviewRequest(
            @NotNull UUID bookingId,
            @Min(1) @Max(5) int rating,
            @Size(max = 500) String comment
    ) {}

    public record ReviewResponse(UUID id, UUID bookingId, int rating, String comment,
                                 String toUserName, Instant createdAt) {}
}
