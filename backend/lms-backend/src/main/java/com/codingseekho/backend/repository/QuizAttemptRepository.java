package com.codingseekho.backend.repository;

import com.codingseekho.backend.entity.QuizAttempt;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface QuizAttemptRepository extends JpaRepository<QuizAttempt, Long> {
    List<QuizAttempt> findByQuizIdOrderBySubmittedAtDesc(Long quizId);
    Optional<QuizAttempt> findTopByQuizIdAndStudentIdOrderBySubmittedAtDesc(Long quizId, Long studentId);
}
