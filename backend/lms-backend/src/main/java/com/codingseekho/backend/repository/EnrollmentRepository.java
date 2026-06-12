package com.codingseekho.backend.repository;

import com.codingseekho.backend.entity.Enrollment;
import com.codingseekho.backend.entity.EnrollmentStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface EnrollmentRepository extends JpaRepository<Enrollment, Long> {
    Optional<Enrollment> findByUserIdAndBatchId(Long userId, Long batchId);
    List<Enrollment> findByUserIdOrderByCreatedAtDesc(Long userId);
    List<Enrollment> findByBatchIdOrderByCreatedAtDesc(Long batchId);
    List<Enrollment> findByBatchIdAndStatus(Long batchId, EnrollmentStatus status);
    boolean existsByUserIdAndBatchIdAndStatus(Long userId, Long batchId, EnrollmentStatus status);
}
