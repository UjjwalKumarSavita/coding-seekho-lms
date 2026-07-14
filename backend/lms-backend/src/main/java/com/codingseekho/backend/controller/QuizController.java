package com.codingseekho.backend.controller;

import com.codingseekho.backend.dto.ApiDtos.*;
import com.codingseekho.backend.entity.*;
import com.codingseekho.backend.repository.*;
import com.codingseekho.backend.service.*;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.*;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import java.util.*;

@RestController
@RequestMapping("/api/quizzes")
@RequiredArgsConstructor
@Transactional
public class QuizController {
    private final QuizRepository quizRepository;
    private final QuizAttemptRepository attemptRepository;
    private final BatchRepository batchRepository;
    private final CurrentUserService currentUserService;
    private final AccessService accessService;
    private final NotificationService notificationService;

    @GetMapping("/batch/{batchId}")
    public List<QuizView> byBatch(@PathVariable Long batchId) {
        User user = currentUserService.get();
        accessService.requireBatchAccess(user, batchId);
        return quizRepository.findByBatchIdOrderByCreatedAtDesc(batchId).stream()
                .filter(quiz -> quiz.isPublished() || user.getRole() != Role.STUDENT)
                .map(quiz -> view(quiz, user, false))
                .toList();
    }

    @GetMapping("/{quizId}")
    public QuizView quiz(@PathVariable Long quizId) {
        User user = currentUserService.get();
        Quiz quiz = findQuiz(quizId);
        accessService.requireBatchAccess(user, quiz.getBatch().getId());
        if (!quiz.isPublished() && user.getRole() == Role.STUDENT) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Quiz not found");
        }
        return view(quiz, user, true);
    }

    @PostMapping
    public ResponseEntity<QuizView> create(@Valid @RequestBody QuizRequest request) {
        User creator = currentUserService.get();
        accessService.requireTeacherOrAdmin(creator);
        accessService.requireBatchAccess(creator, request.batchId());
        Batch batch = batchRepository.findById(request.batchId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Batch not found"));

        Quiz quiz = new Quiz();
        quiz.setBatch(batch);
        quiz.setCreatedBy(creator);
        quiz.setTitle(request.title().trim());
        quiz.setDescription(request.description());
        quiz.setDurationMinutes(request.durationMinutes());
        quiz.setPublished(request.published());

        for (int position = 0; position < request.questions().size(); position++) {
            QuizQuestionRequest input = request.questions().get(position);
            if (input.correctOption() >= input.options().size()) {
                throw new IllegalArgumentException("Correct option must match one of the supplied choices");
            }
            QuizQuestion question = new QuizQuestion();
            question.setQuiz(quiz);
            question.setPrompt(input.prompt().trim());
            question.setOptions(input.options().stream().map(String::trim).toList());
            question.setCorrectOption(input.correctOption());
            question.setPoints(input.points());
            question.setPosition(position);
            quiz.getQuestions().add(question);
        }

        Quiz saved = quizRepository.save(quiz);
        if (saved.isPublished()) {
            notificationService.notifyBatch(batch.getId(), "New quiz: " + saved.getTitle(),
                    "A new practice quiz is ready in " + batch.getName() + ".",
                    "QUIZ", "/quizzes?batch=" + batch.getId());
        }
        return ResponseEntity.status(HttpStatus.CREATED).body(view(saved, creator, true));
    }

    @PostMapping("/{quizId}/submit")
    public QuizAttemptView submit(@PathVariable Long quizId, @Valid @RequestBody QuizSubmitRequest request) {
        User student = currentUserService.get();
        if (student.getRole() != Role.STUDENT) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only students can submit quiz attempts");
        }
        Quiz quiz = findQuiz(quizId);
        accessService.requireBatchAccess(student, quiz.getBatch().getId());
        if (!quiz.isPublished()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "This quiz is not published");
        }

        Map<Long, Integer> selections = new HashMap<>();
        request.answers().forEach(answer -> selections.put(answer.questionId(), answer.selectedOption()));
        QuizAttempt attempt = new QuizAttempt();
        attempt.setQuiz(quiz);
        attempt.setStudent(student);
        int score = 0;
        int maxScore = 0;

        for (QuizQuestion question : quiz.getQuestions()) {
            maxScore += question.getPoints();
            int selected = selections.getOrDefault(question.getId(), -1);
            if (selected >= question.getOptions().size()) {
                throw new IllegalArgumentException("An answer contains an invalid option");
            }
            boolean correct = selected == question.getCorrectOption();
            if (correct) score += question.getPoints();
            QuizAnswer answer = new QuizAnswer();
            answer.setAttempt(attempt);
            answer.setQuestion(question);
            answer.setSelectedOption(selected);
            answer.setCorrect(correct);
            attempt.getAnswers().add(answer);
        }
        attempt.setScore(score);
        attempt.setMaxScore(maxScore);
        return attemptView(attemptRepository.save(attempt), true);
    }

    @GetMapping("/{quizId}/attempts")
    public List<QuizAttemptView> attempts(@PathVariable Long quizId) {
        User user = currentUserService.get();
        accessService.requireTeacherOrAdmin(user);
        Quiz quiz = findQuiz(quizId);
        accessService.requireBatchAccess(user, quiz.getBatch().getId());
        return attemptRepository.findByQuizIdOrderBySubmittedAtDesc(quizId).stream()
                .map(attempt -> attemptView(attempt, false))
                .toList();
    }

    private Quiz findQuiz(Long id) {
        return quizRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Quiz not found"));
    }

    private QuizView view(Quiz quiz, User user, boolean includeQuestions) {
        boolean canSeeAnswers = user.getRole() != Role.STUDENT;
        List<QuizQuestionView> questions = includeQuestions
                ? quiz.getQuestions().stream().map(question -> new QuizQuestionView(
                        question.getId(), question.getPrompt(), List.copyOf(question.getOptions()), question.getPoints(),
                        canSeeAnswers ? question.getCorrectOption() : null)).toList()
                : List.of();
        int totalPoints = quiz.getQuestions().stream().mapToInt(QuizQuestion::getPoints).sum();
        QuizAttemptView latest = user.getRole() == Role.STUDENT
                ? attemptRepository.findTopByQuizIdAndStudentIdOrderBySubmittedAtDesc(quiz.getId(), user.getId())
                        .map(attempt -> attemptView(attempt, false)).orElse(null)
                : null;
        return new QuizView(quiz.getId(), quiz.getBatch().getId(), quiz.getBatch().getName(),
                quiz.getTitle(), quiz.getDescription(), quiz.getDurationMinutes(), quiz.isPublished(),
                UserView.from(quiz.getCreatedBy()), quiz.getCreatedAt(), totalPoints,
                quiz.getQuestions().size(), questions, latest);
    }

    private QuizAttemptView attemptView(QuizAttempt attempt, boolean includeAnswers) {
        List<QuizAnswerReview> reviews = includeAnswers
                ? attempt.getAnswers().stream().map(answer -> new QuizAnswerReview(
                        answer.getQuestion().getId(), answer.getSelectedOption(),
                        answer.getQuestion().getCorrectOption(), answer.isCorrect())).toList()
                : List.of();
        double percentage = attempt.getMaxScore() == 0 ? 0
                : Math.round(attempt.getScore() * 1000.0 / attempt.getMaxScore()) / 10.0;
        return new QuizAttemptView(attempt.getId(), UserView.from(attempt.getStudent()),
                attempt.getScore(), attempt.getMaxScore(), percentage, attempt.getSubmittedAt(), reviews);
    }
}
