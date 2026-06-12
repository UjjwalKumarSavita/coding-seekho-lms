package com.codingseekho.backend.controller;

import com.codingseekho.backend.dto.ApiDtos.*;
import com.codingseekho.backend.entity.*;
import com.codingseekho.backend.repository.*;
import com.codingseekho.backend.service.*;
import lombok.RequiredArgsConstructor;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import java.util.*;

@RestController
@RequestMapping("/api/batches")
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class BatchController {
    private final BatchRepository batchRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final CourseRepository courseRepository;
    private final CurrentUserService currentUserService;
    private final AccessService accessService;

    @GetMapping
    public List<BatchView> myBatches() {
        User user = currentUserService.get();
        if (user.getRole() == Role.ADMIN) {
            return batchRepository.findAll().stream().map(batch ->
                    new BatchView(batch.getId(), batch.getName(), batch.getCode(), batch.getDescription(),
                            batch.isActive(), EnrollmentStatus.ACTIVE, true)).toList();
        }
        return enrollmentRepository.findByUserIdOrderByCreatedAtDesc(user.getId()).stream()
                .map(enrollment -> {
                    Batch batch = enrollment.getBatch();
                    return new BatchView(batch.getId(), batch.getName(), batch.getCode(), batch.getDescription(),
                            batch.isActive(), enrollment.getStatus(), enrollment.isFeePaid());
                }).toList();
    }

    @GetMapping("/{batchId}/courses")
    public List<CourseView> courses(@PathVariable Long batchId) {
        accessService.requireBatchAccess(currentUserService.get(), batchId);
        return courseRepository.findByBatchIdAndActiveTrueOrderByName(batchId).stream()
                .map(course -> new CourseView(course.getId(), batchId, course.getName(), course.getCode(),
                        course.getDescription(), course.isActive())).toList();
    }
}
