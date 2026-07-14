package com.codingseekho.backend.dto;

import com.codingseekho.backend.entity.*;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.time.LocalDateTime;
import java.util.List;

public final class ApiDtos {
    private ApiDtos() {}

    public record UserView(Long id, String username, String email, Role role, boolean enabled,
                           String profilePhoto, String joinedAt) {
        public static UserView from(User user) {
            return new UserView(user.getId(), user.getUsername(), user.getEmail(), user.getRole(),
                    Boolean.TRUE.equals(user.getEnabled()), user.getProfilePhoto(), user.getJoinedAt());
        }
    }

    public record AuthResponse(String token, UserView user) {}
    public record MessageResponse(String message) {}
    public record ResetRequest(@NotBlank @Email String email) {}
    public record ResetConfirm(@NotBlank @Email String email, @NotBlank String code,
                               @NotBlank @Size(min = 8) String newPassword) {}
    public record PasswordChange(@NotBlank String oldPassword, @NotBlank @Size(min = 8) String newPassword) {}
    public record PhotoUpdate(@NotBlank String profilePhoto) {}

    public record BatchRequest(@NotBlank String name, @NotBlank String code, String description, Boolean active) {}
    public record BatchView(Long id, String name, String code, String description, boolean active,
                            EnrollmentStatus enrollmentStatus, boolean feePaid) {}
    public record EnrollmentRequest(@NotNull Long userId, @NotNull Long batchId, boolean feePaid,
                                    @NotNull EnrollmentStatus status) {}
    public record EnrollmentView(Long id, UserView user, BatchView batch, EnrollmentStatus status,
                                 boolean feePaid, LocalDateTime createdAt, LocalDateTime approvedAt) {}

    public record CourseRequest(@NotNull Long batchId, @NotBlank String name, @NotBlank String code,
                                String description, Boolean active) {}
    public record CourseView(Long id, Long batchId, String name, String code, String description, boolean active) {}

    public record ChatRequest(@NotBlank @Size(max = 3000) String content) {}
    public record ChatView(Long id, Long batchId, UserView sender, String content, LocalDateTime sentAt) {}
    public record SupportChatView(Long id, UserView student, UserView sender, String content, LocalDateTime sentAt) {}

    public record MeetingRequest(@NotNull Long batchId, @NotBlank String title, String subject,
                                 @NotNull MeetingProvider provider, @NotBlank String joinUrl,
                                 @NotNull LocalDateTime scheduledAt, LocalDateTime endsAt, MeetingStatus status) {}
    public record MeetingView(Long id, Long batchId, String batchName, UserView teacher, String title,
                              String subject, MeetingProvider provider, String joinUrl,
                              LocalDateTime scheduledAt, LocalDateTime endsAt, MeetingStatus status,
                              LocalDateTime createdAt) {}
    public record AttendanceView(Long id, UserView student, LocalDateTime joinedAt, LocalDateTime leftAt) {}

    public record AssignmentRequest(@NotNull Long batchId, @NotBlank String title, String description,
                                    @NotNull LocalDateTime dueAt, @Min(1) @Max(1000) Integer maxScore) {}
    public record AssignmentView(Long id, Long batchId, UserView teacher, String title, String description,
                                 LocalDateTime dueAt, Integer maxScore, String attachmentName,
                                 LocalDateTime createdAt, SubmissionView mySubmission) {}
    public record SubmissionView(Long id, Long assignmentId, UserView student, String answer, String fileName,
                                 LocalDateTime submittedAt, Integer score, String feedback, LocalDateTime gradedAt) {}
    public record GradeRequest(@NotNull @Min(0) Integer score, String feedback) {}

    public record QuizQuestionRequest(@NotBlank String prompt, @NotNull @Size(min = 2, max = 6) List<@NotBlank String> options,
                                      @Min(0) int correctOption, @Min(1) @Max(100) int points) {}
    public record QuizRequest(@NotNull Long batchId, @NotBlank String title, String description,
                              @Min(1) @Max(180) int durationMinutes, boolean published,
                              @NotEmpty List<@Valid QuizQuestionRequest> questions) {}
    public record QuizQuestionView(Long id, String prompt, List<String> options, int points,
                                   Integer correctOption) {}
    public record QuizAnswerRequest(@NotNull Long questionId, @Min(0) int selectedOption) {}
    public record QuizSubmitRequest(@NotNull List<@Valid QuizAnswerRequest> answers) {}
    public record QuizAnswerReview(Long questionId, int selectedOption, int correctOption, boolean correct) {}
    public record QuizAttemptView(Long id, UserView student, int score, int maxScore, double percentage,
                                  LocalDateTime submittedAt, List<QuizAnswerReview> answers) {}
    public record QuizView(Long id, Long batchId, String batchName, String title, String description,
                           int durationMinutes, boolean published, UserView createdBy, LocalDateTime createdAt,
                           int totalPoints, int questionCount, List<QuizQuestionView> questions,
                           QuizAttemptView latestAttempt) {}

    public record DoubtThreadRequest(@NotNull Long batchId, @NotBlank @Size(max = 180) String title,
                                     @NotBlank @Size(max = 5000) String content,
                                     @NotBlank @Size(max = 80) String topic) {}
    public record DoubtReplyRequest(@NotBlank @Size(max = 5000) String content) {}
    public record DoubtReplyView(Long id, UserView author, String content, LocalDateTime createdAt) {}
    public record DoubtThreadView(Long id, Long batchId, String batchName, UserView author, String title,
                                  String content, String topic, boolean resolved, LocalDateTime createdAt,
                                  List<DoubtReplyView> replies) {}

    public record NotificationView(Long id, String title, String message, String type, String actionUrl,
                                   boolean read, LocalDateTime createdAt) {}
    public record DashboardView(long batches, long courses, long upcomingMeetings, long pendingAssignments,
                                long unreadNotifications, double attendancePercent, List<MeetingView> nextMeetings) {}
}
