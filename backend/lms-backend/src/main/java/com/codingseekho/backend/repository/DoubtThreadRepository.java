package com.codingseekho.backend.repository;

import com.codingseekho.backend.entity.DoubtThread;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface DoubtThreadRepository extends JpaRepository<DoubtThread, Long> {
    List<DoubtThread> findByBatchIdOrderByCreatedAtDesc(Long batchId);
}
