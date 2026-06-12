package com.codingseekho.backend.controller;

import com.codingseekho.backend.dto.ApiDtos.*;
import com.codingseekho.backend.entity.*;
import com.codingseekho.backend.repository.*;
import com.codingseekho.backend.service.NotificationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;
import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
@Transactional
public class AdminController {
    private final UserRepository userRepository;
    private final BatchRepository batchRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final CourseRepository courseRepository;
    private final NotificationService notificationService;

    public record UserAdminUpdate(Role role, Boolean enabled) {}

    @GetMapping("/users")
    public List<UserView> users() {
        return userRepository.findAll().stream().map(UserView::from).toList();
    }

    @PutMapping("/users/{id}")
    public UserView updateUser(@PathVariable Long id, @RequestBody UserAdminUpdate request) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
        if (request.role() != null) user.setRole(request.role());
        if (request.enabled() != null) user.setEnabled(request.enabled());
        return UserView.from(userRepository.save(user));
    }

    @GetMapping("/batches")
    public List<BatchView> batches() {
        return batchRepository.findAll().stream().map(this::batchView).toList();
    }

    @PostMapping("/batches")
    public BatchView createBatch(@Valid @RequestBody BatchRequest request) {
        if (batchRepository.existsByCodeIgnoreCase(request.code())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Batch code already exists");
        }
        Batch batch = new Batch();
        applyBatch(batch, request);
        return batchView(batchRepository.save(batch));
    }

    @PutMapping("/batches/{id}")
    public BatchView updateBatch(@PathVariable Long id, @Valid @RequestBody BatchRequest request) {
        Batch batch = batchRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Batch not found"));
        applyBatch(batch, request);
        return batchView(batchRepository.save(batch));
    }

    @GetMapping("/batches/{id}/enrollments")
    public List<EnrollmentView> enrollments(@PathVariable Long id) {
        return enrollmentRepository.findByBatchIdOrderByCreatedAtDesc(id).stream()
                .map(this::enrollmentView).toList();
    }

    @PostMapping("/enrollments")
    public EnrollmentView enroll(@Valid @RequestBody EnrollmentRequest request) {
        User user = userRepository.findById(request.userId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
        Batch batch = batchRepository.findById(request.batchId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Batch not found"));
        Enrollment enrollment = enrollmentRepository.findByUserIdAndBatchId(user.getId(), batch.getId())
                .orElseGet(Enrollment::new);
        enrollment.setUser(user);
        enrollment.setBatch(batch);
        enrollment.setFeePaid(request.feePaid());
        enrollment.setStatus(request.status());
        if (request.status() == EnrollmentStatus.ACTIVE) enrollment.setApprovedAt(LocalDateTime.now());
        Enrollment saved = enrollmentRepository.save(enrollment);
        notificationService.notifyUser(user, "Batch access updated",
                "Your access to " + batch.getName() + " is now " + request.status() + ".",
                "ENROLLMENT", "/batches/" + batch.getId(), true);
        return enrollmentView(saved);
    }

    @PostMapping("/courses")
    public CourseView createCourse(@Valid @RequestBody CourseRequest request) {
        Batch batch = batchRepository.findById(request.batchId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Batch not found"));
        Course course = new Course();
        course.setBatch(batch);
        course.setName(request.name());
        course.setCode(request.code());
        course.setDescription(request.description());
        course.setActive(request.active() == null || request.active());
        Course saved = courseRepository.save(course);
        return courseView(saved);
    }

    private void applyBatch(Batch batch, BatchRequest request) {
        batch.setName(request.name());
        batch.setCode(request.code().trim().toUpperCase());
        batch.setDescription(request.description());
        if (request.active() != null) batch.setActive(request.active());
    }

    private BatchView batchView(Batch batch) {
        return new BatchView(batch.getId(), batch.getName(), batch.getCode(), batch.getDescription(),
                batch.isActive(), null, false);
    }

    private EnrollmentView enrollmentView(Enrollment enrollment) {
        return new EnrollmentView(enrollment.getId(), UserView.from(enrollment.getUser()),
                batchView(enrollment.getBatch()), enrollment.getStatus(), enrollment.isFeePaid(),
                enrollment.getCreatedAt(), enrollment.getApprovedAt());
    }

    private CourseView courseView(Course course) {
        return new CourseView(course.getId(), course.getBatch().getId(), course.getName(), course.getCode(),
                course.getDescription(), course.isActive());
    }
}
