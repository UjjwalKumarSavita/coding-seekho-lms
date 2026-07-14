package com.codingseekho.backend.repository;

import com.codingseekho.backend.entity.Quiz;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface QuizRepository extends JpaRepository<Quiz, Long> {
    List<Quiz> findByBatchIdOrderByCreatedAtDesc(Long batchId);
}
