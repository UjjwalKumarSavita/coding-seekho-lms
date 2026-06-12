package com.codingseekho.backend.repository;

import com.codingseekho.backend.entity.SupportMessage;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface SupportMessageRepository extends JpaRepository<SupportMessage, Long> {
    List<SupportMessage> findByStudentIdOrderBySentAt(Long studentId);
}
