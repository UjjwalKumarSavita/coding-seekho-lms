package com.codingseekho.backend.controller;

import com.codingseekho.backend.dto.ApiDtos.*;
import com.codingseekho.backend.entity.*;
import com.codingseekho.backend.repository.*;
import com.codingseekho.backend.service.CurrentUserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import java.util.List;

@RestController
@RequestMapping("/api/support")
@RequiredArgsConstructor
@Transactional
public class SupportController {
    private final SupportMessageRepository supportRepository;
    private final UserRepository userRepository;
    private final CurrentUserService currentUserService;

    @GetMapping("/students")
    public List<UserView> students() {
        User current = currentUserService.get();
        if (current.getRole() == Role.STUDENT) throw new AccessDeniedException("Staff access is required");
        return userRepository.findByRoleOrderByUsername(Role.STUDENT).stream().map(UserView::from).toList();
    }

    @GetMapping
    public List<SupportChatView> conversation(@RequestParam(required = false) Long studentId) {
        User current = currentUserService.get();
        Long targetId = current.getRole() == Role.STUDENT ? current.getId() : studentId;
        if (targetId == null) throw new IllegalArgumentException("studentId is required");
        return supportRepository.findByStudentIdOrderBySentAt(targetId).stream().map(this::view).toList();
    }

    @PostMapping
    public SupportChatView send(@RequestParam(required = false) Long studentId,
                                @Valid @RequestBody ChatRequest request) {
        User current = currentUserService.get();
        User student;
        if (current.getRole() == Role.STUDENT) {
            student = current;
        } else {
            if (studentId == null) throw new IllegalArgumentException("studentId is required");
            student = userRepository.findById(studentId)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Student not found"));
            if (student.getRole() != Role.STUDENT) throw new AccessDeniedException("Support chats belong to students");
        }
        SupportMessage message = new SupportMessage();
        message.setStudent(student);
        message.setSender(current);
        message.setContent(request.content().trim());
        return view(supportRepository.save(message));
    }

    private SupportChatView view(SupportMessage message) {
        return new SupportChatView(message.getId(), UserView.from(message.getStudent()),
                UserView.from(message.getSender()), message.getContent(), message.getSentAt());
    }
}
