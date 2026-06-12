package com.codingseekho.backend.service;

import com.codingseekho.backend.entity.*;
import com.codingseekho.backend.repository.EnrollmentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AccessService {
    private final EnrollmentRepository enrollmentRepository;

    public void requireBatchAccess(User user, Long batchId) {
        if (user.getRole() == Role.ADMIN) return;
        if (!enrollmentRepository.existsByUserIdAndBatchIdAndStatus(user.getId(), batchId, EnrollmentStatus.ACTIVE)) {
            throw new AccessDeniedException("You do not have access to this batch");
        }
    }

    public void requireTeacherOrAdmin(User user) {
        if (user.getRole() == Role.STUDENT) {
            throw new AccessDeniedException("Teacher or admin access is required");
        }
    }
}
