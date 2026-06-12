package com.codingseekho.backend.controller;

import com.codingseekho.backend.dto.ApiDtos.*;
import com.codingseekho.backend.entity.*;
import com.codingseekho.backend.repository.*;
import com.codingseekho.backend.service.CurrentUserService;
import lombok.RequiredArgsConstructor;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDateTime;
import java.util.*;

@RestController
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class DashboardController {
    private final BatchRepository batchRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final CourseRepository courseRepository;
    private final MeetingRepository meetingRepository;
    private final MeetingAttendanceRepository attendanceRepository;
    private final AssignmentRepository assignmentRepository;
    private final SubmissionRepository submissionRepository;
    private final NotificationRepository notificationRepository;
    private final CurrentUserService currentUserService;

    @GetMapping
    public DashboardView dashboard() {
        User user = currentUserService.get();
        List<Enrollment> memberships = enrollmentRepository.findByUserIdOrderByCreatedAtDesc(user.getId()).stream()
                .filter(value -> value.getStatus() == EnrollmentStatus.ACTIVE).toList();
        List<Long> batchIds = user.getRole() == Role.ADMIN
                ? batchRepository.findAll().stream().filter(Batch::isActive).map(Batch::getId).toList()
                : memberships.stream().map(value -> value.getBatch().getId()).toList();

        List<Meeting> meetings = batchIds.stream()
                .flatMap(id -> meetingRepository.findByBatchIdOrderByScheduledAtDesc(id).stream()).toList();
        List<Meeting> upcoming = meetings.stream()
                .filter(value -> value.getStatus() != MeetingStatus.CANCELLED
                        && value.getScheduledAt().isAfter(LocalDateTime.now().minusHours(3)))
                .sorted(Comparator.comparing(Meeting::getScheduledAt)).limit(5).toList();
        long courses = batchIds.stream().mapToLong(id ->
                courseRepository.findByBatchIdAndActiveTrueOrderByName(id).size()).sum();
        long assignments = batchIds.stream().flatMap(id ->
                assignmentRepository.findByBatchIdOrderByDueAtDesc(id).stream())
                .filter(value -> value.getDueAt().isAfter(LocalDateTime.now())
                        && (user.getRole() != Role.STUDENT
                        || submissionRepository.findByAssignmentIdAndStudentId(value.getId(), user.getId()).isEmpty()))
                .count();

        double attendance = 0;
        if (user.getRole() == Role.STUDENT && !meetings.isEmpty()) {
            long attended = batchIds.stream().mapToLong(id ->
                    attendanceRepository.countByMeetingBatchIdAndStudentId(id, user.getId())).sum();
            attendance = Math.min(100, attended * 100.0 / meetings.size());
        }
        List<MeetingView> next = upcoming.stream().map(value -> new MeetingView(value.getId(),
                value.getBatch().getId(), value.getBatch().getName(), UserView.from(value.getTeacher()),
                value.getTitle(), value.getSubject(), value.getProvider(), value.getJoinUrl(),
                value.getScheduledAt(), value.getEndsAt(), value.getStatus(), value.getCreatedAt())).toList();
        return new DashboardView(batchIds.size(), courses, upcoming.size(), assignments,
                notificationRepository.countByUserIdAndReadFlagFalse(user.getId()), attendance, next);
    }
}
