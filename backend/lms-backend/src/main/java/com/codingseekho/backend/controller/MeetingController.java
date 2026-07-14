package com.codingseekho.backend.controller;

import com.codingseekho.backend.dto.ApiDtos.*;
import com.codingseekho.backend.entity.*;
import com.codingseekho.backend.repository.*;
import com.codingseekho.backend.service.*;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.transaction.annotation.Transactional;
import java.net.URI;
import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;

@RestController
@RequestMapping("/api/meetings")
@RequiredArgsConstructor
@Transactional
public class MeetingController {
    private final MeetingRepository meetingRepository;
    private final MeetingAttendanceRepository attendanceRepository;
    private final BatchRepository batchRepository;
    private final CurrentUserService currentUserService;
    private final AccessService accessService;
    private final NotificationService notificationService;
    private final EnrollmentRepository enrollmentRepository;

    @GetMapping("/schedule")
    public List<MeetingView> schedule() {
        User user = currentUserService.get();
        List<Long> batchIds = user.getRole() == Role.ADMIN
                ? batchRepository.findAll().stream().filter(Batch::isActive).map(Batch::getId).toList()
                : enrollmentRepository.findByUserIdOrderByCreatedAtDesc(user.getId()).stream()
                        .filter(enrollment -> enrollment.getStatus() == EnrollmentStatus.ACTIVE)
                        .map(enrollment -> enrollment.getBatch().getId()).toList();
        return batchIds.stream()
                .flatMap(batchId -> meetingRepository.findByBatchIdOrderByScheduledAtDesc(batchId).stream())
                .sorted(Comparator.comparing(Meeting::getScheduledAt))
                .map(this::view)
                .toList();
    }

    @GetMapping("/batch/{batchId}")
    public List<MeetingView> meetings(@PathVariable Long batchId) {
        accessService.requireBatchAccess(currentUserService.get(), batchId);
        return meetingRepository.findByBatchIdOrderByScheduledAtDesc(batchId).stream().map(this::view).toList();
    }

    @PostMapping
    public ResponseEntity<MeetingView> create(@Valid @RequestBody MeetingRequest request) {
        User teacher = currentUserService.get();
        accessService.requireTeacherOrAdmin(teacher);
        accessService.requireBatchAccess(teacher, request.batchId());
        validateProviderUrl(request.provider(), request.joinUrl());
        Batch batch = batchRepository.findById(request.batchId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Batch not found"));

        Meeting meeting = new Meeting();
        meeting.setBatch(batch);
        meeting.setTeacher(teacher);
        meeting.setTitle(request.title());
        meeting.setSubject(request.subject());
        meeting.setProvider(request.provider());
        meeting.setJoinUrl(request.joinUrl());
        meeting.setScheduledAt(request.scheduledAt());
        meeting.setEndsAt(request.endsAt());
        meeting.setStatus(request.status() == null
                ? (request.scheduledAt().isAfter(LocalDateTime.now()) ? MeetingStatus.SCHEDULED : MeetingStatus.LIVE)
                : request.status());
        Meeting saved = meetingRepository.save(meeting);
        notificationService.notifyBatch(batch.getId(), "New class: " + saved.getTitle(),
                "Your " + saved.getProvider().name().replace('_', ' ') + " class is scheduled for "
                        + saved.getScheduledAt() + ".", "MEETING", "/batches/" + batch.getId());
        return ResponseEntity.status(HttpStatus.CREATED).body(view(saved));
    }

    @PostMapping("/{meetingId}/join")
    public MeetingView join(@PathVariable Long meetingId) {
        Meeting meeting = findMeeting(meetingId);
        User user = currentUserService.get();
        accessService.requireBatchAccess(user, meeting.getBatch().getId());
        if (user.getRole() == Role.STUDENT) {
            MeetingAttendance attendance = attendanceRepository
                    .findByMeetingIdAndStudentId(meetingId, user.getId())
                    .orElseGet(MeetingAttendance::new);
            attendance.setMeeting(meeting);
            attendance.setStudent(user);
            if (attendance.getJoinedAt() == null) attendance.setJoinedAt(LocalDateTime.now());
            attendanceRepository.save(attendance);
        }
        return view(meeting);
    }

    @PostMapping("/{meetingId}/leave")
    public MessageResponse leave(@PathVariable Long meetingId) {
        User user = currentUserService.get();
        Meeting meeting = findMeeting(meetingId);
        accessService.requireBatchAccess(user, meeting.getBatch().getId());
        attendanceRepository.findByMeetingIdAndStudentId(meetingId, user.getId()).ifPresent(attendance -> {
            attendance.setLeftAt(LocalDateTime.now());
            attendanceRepository.save(attendance);
        });
        return new MessageResponse("Attendance updated.");
    }

    @GetMapping("/{meetingId}/attendance")
    public List<AttendanceView> attendance(@PathVariable Long meetingId) {
        User user = currentUserService.get();
        accessService.requireTeacherOrAdmin(user);
        Meeting meeting = findMeeting(meetingId);
        accessService.requireBatchAccess(user, meeting.getBatch().getId());
        return attendanceRepository.findByMeetingIdOrderByJoinedAt(meetingId).stream()
                .map(value -> new AttendanceView(value.getId(), UserView.from(value.getStudent()),
                        value.getJoinedAt(), value.getLeftAt())).toList();
    }

    private Meeting findMeeting(Long id) {
        return meetingRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Meeting not found"));
    }

    private MeetingView view(Meeting meeting) {
        return new MeetingView(meeting.getId(), meeting.getBatch().getId(), meeting.getBatch().getName(),
                UserView.from(meeting.getTeacher()), meeting.getTitle(), meeting.getSubject(),
                meeting.getProvider(), meeting.getJoinUrl(), meeting.getScheduledAt(), meeting.getEndsAt(),
                meeting.getStatus(), meeting.getCreatedAt());
    }

    private void validateProviderUrl(MeetingProvider provider, String url) {
        try {
            String host = URI.create(url).getHost();
            boolean valid = host != null && switch (provider) {
                case GOOGLE_MEET -> host.equals("meet.google.com");
                case ZOOM -> host.equals("zoom.us") || host.endsWith(".zoom.us");
            };
            if (!valid) throw new IllegalArgumentException("The meeting URL does not match the selected provider");
        } catch (IllegalArgumentException ex) {
            throw new IllegalArgumentException("Enter a valid " + provider.name().replace('_', ' ') + " URL");
        }
    }
}
