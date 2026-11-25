package com.zevora.user;

import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/users")
public class UserController {
    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping("/me")
    public UserDtos.MeResponse me() {
        return userService.me();
    }

    @PutMapping("/me")
    public UserDtos.MeResponse updateMe(@Valid @RequestBody UserDtos.UpdateMeRequest request) {
        return userService.updateMe(request);
    }

    @GetMapping("/me/profile")
    public UserDtos.ProfileResponse profile() {
        return UserDtos.ProfileResponse.from(userService.profileOf(userService.currentUser().getId()));
    }
}
