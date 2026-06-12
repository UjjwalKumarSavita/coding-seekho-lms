package com.codingseekho.backend.repository;

import com.codingseekho.backend.entity.Meeting;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface MeetingRepository extends JpaRepository<Meeting, Long> {
    List<Meeting> findByBatchIdOrderByScheduledAtDesc(Long batchId);
}
