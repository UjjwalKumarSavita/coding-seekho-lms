package com.codingseekho.backend.controller;

import com.codingseekho.backend.dto.ApiDtos.*;
import com.codingseekho.backend.entity.Notification;
import com.codingseekho.backend.repository.NotificationRepository;
import com.codingseekho.backend.service.CurrentUserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
@Transactional
public class NotificationController {
    private final NotificationRepository notificationRepository;
    private final CurrentUserService currentUserService;

    @GetMapping
    public List<NotificationView> notifications() {
        Long userId = currentUserService.get().getId();
        return notificationRepository.findTop50ByUserIdOrderByCreatedAtDesc(userId).stream()
                .map(this::view).toList();
    }

    @PutMapping("/{id}/read")
    public NotificationView read(@PathVariable Long id) {
        Long userId = currentUserService.get().getId();
        Notification notification = notificationRepository.findById(id)
                .filter(value -> value.getUser().getId().equals(userId))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Notification not found"));
        notification.setReadFlag(true);
        return view(notificationRepository.save(notification));
    }

    private NotificationView view(Notification value) {
        return new NotificationView(value.getId(), value.getTitle(), value.getMessage(), value.getType(),
                value.getActionUrl(), value.isReadFlag(), value.getCreatedAt());
    }
}
