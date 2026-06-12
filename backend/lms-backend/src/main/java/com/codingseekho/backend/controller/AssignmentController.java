package com.codingseekho.backend.controller;

import com.codingseekho.backend.dto.ApiDtos.*;
import com.codingseekho.backend.entity.*;
import com.codingseekho.backend.repository.*;
import com.codingseekho.backend.service.*;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/assignments")
@RequiredArgsConstructor
@Transactional
public class AssignmentController {
    private final AssignmentRepository assignmentRepository;
    private final SubmissionRepository submissionRepository;
    private final BatchRepository batchRepository;
    private final CurrentUserService currentUserService;
    private final AccessService accessService;
    private final FileStorageService fileStorageService;
    private final NotificationService notificationService;

    @GetMapping("/batch/{batchId}")
    public List<AssignmentView> assignments(@PathVariable Long batchId) {
        User user = currentUserService.get();
        accessService.requireBatchAccess(user, batchId);
        return assignmentRepository.findByBatchIdOrderByDueAtDesc(batchId).stream()
                .map(assignment -> view(assignment, user)).toList();
    }

    @PostMapping
    public ResponseEntity<AssignmentView> create(@Valid @RequestBody AssignmentRequest request) {
        User teacher = currentUserService.get();
        accessService.requireTeacherOrAdmin(teacher);
        accessService.requireBatchAccess(teacher, request.batchId());
        Batch batch = batchRepository.findById(request.batchId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Batch not found"));
        Assignment assignment = new Assignment();
        assignment.setBatch(batch);
        assignment.setTeacher(teacher);
        assignment.setTitle(request.title());
        assignment.setDescription(request.description());
        assignment.setDueAt(request.dueAt());
        assignment.setMaxScore(request.maxScore() == null ? 100 : request.maxScore());
        Assignment saved = assignmentRepository.save(assignment);
        notificationService.notifyBatch(batch.getId(), "New assignment: " + saved.getTitle(),
                "Due " + saved.getDueAt() + ".", "ASSIGNMENT", "/batches/" + batch.getId());
        return ResponseEntity.status(HttpStatus.CREATED).body(view(saved, teacher));
    }

    @PostMapping(value = "/{assignmentId}/submit", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public SubmissionView submit(@PathVariable Long assignmentId,
                                 @RequestParam(required = false, defaultValue = "") String answer,
                                 @RequestPart(required = false) MultipartFile file) {
        User student = currentUserService.get();
        if (student.getRole() != Role.STUDENT) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only students submit assignments");
        }
        Assignment assignment = findAssignment(assignmentId);
        accessService.requireBatchAccess(student, assignment.getBatch().getId());
        Submission submission = submissionRepository.findByAssignmentIdAndStudentId(assignmentId, student.getId())
                .orElseGet(Submission::new);
        submission.setAssignment(assignment);
        submission.setStudent(student);
        submission.setAnswer(answer);
        submission.setSubmittedAt(LocalDateTime.now());
        if (file != null && !file.isEmpty()) {
            submission.setFileName(file.getOriginalFilename());
            submission.setFilePath(fileStorageService.store(file, "submissions"));
        }
        return submissionView(submissionRepository.save(submission));
    }

    @GetMapping("/{assignmentId}/submissions")
    public List<SubmissionView> submissions(@PathVariable Long assignmentId) {
        User teacher = currentUserService.get();
        accessService.requireTeacherOrAdmin(teacher);
        Assignment assignment = findAssignment(assignmentId);
        accessService.requireBatchAccess(teacher, assignment.getBatch().getId());
        return submissionRepository.findByAssignmentIdOrderBySubmittedAt(assignmentId).stream()
                .map(this::submissionView).toList();
    }

    @PutMapping("/submissions/{submissionId}/grade")
    public SubmissionView grade(@PathVariable Long submissionId, @Valid @RequestBody GradeRequest request) {
        User teacher = currentUserService.get();
        accessService.requireTeacherOrAdmin(teacher);
        Submission submission = submissionRepository.findById(submissionId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Submission not found"));
        accessService.requireBatchAccess(teacher, submission.getAssignment().getBatch().getId());
        if (request.score() > submission.getAssignment().getMaxScore()) {
            throw new IllegalArgumentException("Score cannot exceed the assignment maximum");
        }
        submission.setScore(request.score());
        submission.setFeedback(request.feedback());
        submission.setGradedAt(LocalDateTime.now());
        Submission saved = submissionRepository.save(submission);
        notificationService.notifyUser(saved.getStudent(), "Assignment graded",
                saved.getAssignment().getTitle() + ": " + saved.getScore() + "/"
                        + saved.getAssignment().getMaxScore(), "GRADE",
                "/batches/" + saved.getAssignment().getBatch().getId(), true);
        return submissionView(saved);
    }

    private Assignment findAssignment(Long id) {
        return assignmentRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Assignment not found"));
    }

    private AssignmentView view(Assignment assignment, User user) {
        SubmissionView mine = user.getRole() == Role.STUDENT
                ? submissionRepository.findByAssignmentIdAndStudentId(assignment.getId(), user.getId())
                    .map(this::submissionView).orElse(null)
                : null;
        return new AssignmentView(assignment.getId(), assignment.getBatch().getId(),
                UserView.from(assignment.getTeacher()), assignment.getTitle(), assignment.getDescription(),
                assignment.getDueAt(), assignment.getMaxScore(), assignment.getAttachmentName(),
                assignment.getCreatedAt(), mine);
    }

    private SubmissionView submissionView(Submission submission) {
        return new SubmissionView(submission.getId(), submission.getAssignment().getId(),
                UserView.from(submission.getStudent()), submission.getAnswer(), submission.getFileName(),
                submission.getSubmittedAt(), submission.getScore(), submission.getFeedback(),
                submission.getGradedAt());
    }
}
