package com.codingseekho.backend.repository;

import com.codingseekho.backend.entity.MeetingAttendance;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface MeetingAttendanceRepository extends JpaRepository<MeetingAttendance, Long> {
    Optional<MeetingAttendance> findByMeetingIdAndStudentId(Long meetingId, Long studentId);
    List<MeetingAttendance> findByMeetingIdOrderByJoinedAt(Long meetingId);
    long countByMeetingBatchIdAndStudentId(Long batchId, Long studentId);
}
