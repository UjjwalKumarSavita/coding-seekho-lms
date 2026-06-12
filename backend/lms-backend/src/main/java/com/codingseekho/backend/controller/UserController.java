package com.codingseekho.backend.controller;

import com.codingseekho.backend.dto.ApiDtos.*;
import com.codingseekho.backend.entity.User;
import com.codingseekho.backend.repository.UserRepository;
import com.codingseekho.backend.service.CurrentUserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;

@RestController
@RequestMapping("/api/user")
@RequiredArgsConstructor
public class UserController {
    private final CurrentUserService currentUserService;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @GetMapping("/profile")
    public UserView profile() {
        return UserView.from(currentUserService.get());
    }

    @PutMapping("/photo")
    public UserView updatePhoto(@Valid @RequestBody PhotoUpdate request) {
        User user = currentUserService.get();
        user.setProfilePhoto(request.profilePhoto());
        return UserView.from(userRepository.save(user));
    }

    @PutMapping("/password")
    public MessageResponse changePassword(@Valid @RequestBody PasswordChange request) {
        User user = currentUserService.get();
        if (!passwordEncoder.matches(request.oldPassword(), user.getPassword())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Current password is incorrect");
        }
        user.setPassword(passwordEncoder.encode(request.newPassword()));
        userRepository.save(user);
        return new MessageResponse("Password changed successfully.");
    }
}
