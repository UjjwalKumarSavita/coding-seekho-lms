package com.codingseekho.backend.repository;

import com.codingseekho.backend.entity.Submission;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface SubmissionRepository extends JpaRepository<Submission, Long> {
    Optional<Submission> findByAssignmentIdAndStudentId(Long assignmentId, Long studentId);
    List<Submission> findByAssignmentIdOrderBySubmittedAt(Long assignmentId);
    long countByAssignmentBatchIdAndStudentId(Long batchId, Long studentId);
}
