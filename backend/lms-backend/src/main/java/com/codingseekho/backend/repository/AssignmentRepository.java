package com.codingseekho.backend.repository;

import com.codingseekho.backend.entity.Assignment;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface AssignmentRepository extends JpaRepository<Assignment, Long> {
    List<Assignment> findByBatchIdOrderByDueAtDesc(Long batchId);
}
