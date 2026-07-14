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
import java.util.List;

@RestController
@RequestMapping("/api/doubts")
@RequiredArgsConstructor
@Transactional
public class DoubtController {
    private final DoubtThreadRepository threadRepository;
    private final BatchRepository batchRepository;
    private final CurrentUserService currentUserService;
    private final AccessService accessService;
    private final NotificationService notificationService;

    @GetMapping("/batch/{batchId}")
    public List<DoubtThreadView> byBatch(@PathVariable Long batchId) {
        accessService.requireBatchAccess(currentUserService.get(), batchId);
        return threadRepository.findByBatchIdOrderByCreatedAtDesc(batchId).stream().map(this::view).toList();
    }

    @PostMapping
    public ResponseEntity<DoubtThreadView> create(@Valid @RequestBody DoubtThreadRequest request) {
        User author = currentUserService.get();
        accessService.requireBatchAccess(author, request.batchId());
        Batch batch = batchRepository.findById(request.batchId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Batch not found"));
        DoubtThread thread = new DoubtThread();
        thread.setBatch(batch);
        thread.setAuthor(author);
        thread.setTitle(request.title().trim());
        thread.setContent(request.content().trim());
        thread.setTopic(request.topic().trim());
        DoubtThread saved = threadRepository.save(thread);
        if (author.getRole() == Role.STUDENT) {
            notificationService.notifyBatch(batch.getId(), "New doubt: " + saved.getTitle(),
                    author.getUsername() + " asked a question in " + batch.getName() + ".",
                    "DOUBT", "/doubts?batch=" + batch.getId());
        }
        return ResponseEntity.status(HttpStatus.CREATED).body(view(saved));
    }

    @PostMapping("/{threadId}/replies")
    public DoubtThreadView reply(@PathVariable Long threadId, @Valid @RequestBody DoubtReplyRequest request) {
        User author = currentUserService.get();
        DoubtThread thread = findThread(threadId);
        accessService.requireBatchAccess(author, thread.getBatch().getId());
        DoubtReply reply = new DoubtReply();
        reply.setThread(thread);
        reply.setAuthor(author);
        reply.setContent(request.content().trim());
        thread.getReplies().add(reply);
        DoubtThread saved = threadRepository.save(thread);
        notificationService.notifyUser(thread.getAuthor(), "New answer to: " + thread.getTitle(),
                author.getUsername() + " replied to your doubt.", "DOUBT",
                "/doubts?batch=" + thread.getBatch().getId() + "&thread=" + thread.getId(), true);
        return view(saved);
    }

    @PutMapping("/{threadId}/resolved")
    public DoubtThreadView resolve(@PathVariable Long threadId, @RequestParam boolean value) {
        User user = currentUserService.get();
        DoubtThread thread = findThread(threadId);
        accessService.requireBatchAccess(user, thread.getBatch().getId());
        if (user.getRole() == Role.STUDENT && !thread.getAuthor().getId().equals(user.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only the author or teaching team can update this doubt");
        }
        thread.setResolved(value);
        return view(threadRepository.save(thread));
    }

    private DoubtThread findThread(Long id) {
        return threadRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Doubt not found"));
    }

    private DoubtThreadView view(DoubtThread thread) {
        List<DoubtReplyView> replies = thread.getReplies().stream()
                .map(reply -> new DoubtReplyView(reply.getId(), UserView.from(reply.getAuthor()),
                        reply.getContent(), reply.getCreatedAt())).toList();
        return new DoubtThreadView(thread.getId(), thread.getBatch().getId(), thread.getBatch().getName(),
                UserView.from(thread.getAuthor()), thread.getTitle(), thread.getContent(), thread.getTopic(),
                thread.isResolved(), thread.getCreatedAt(), replies);
    }
}
