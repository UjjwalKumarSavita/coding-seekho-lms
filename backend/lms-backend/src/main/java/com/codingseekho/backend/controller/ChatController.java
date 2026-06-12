package com.codingseekho.backend.controller;

import com.codingseekho.backend.dto.ApiDtos.*;
import com.codingseekho.backend.entity.*;
import com.codingseekho.backend.repository.*;
import com.codingseekho.backend.service.*;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.transaction.annotation.Transactional;
import java.util.*;

@RestController
@RequestMapping("/api/chat")
@RequiredArgsConstructor
@Transactional
public class ChatController {
    private final GroupMessageRepository messageRepository;
    private final BatchRepository batchRepository;
    private final CurrentUserService currentUserService;
    private final AccessService accessService;

    @GetMapping("/batches/{batchId}")
    public List<ChatView> messages(@PathVariable Long batchId) {
        User user = currentUserService.get();
        accessService.requireBatchAccess(user, batchId);
        List<GroupMessage> messages = new ArrayList<>(
                messageRepository.findTop100ByBatchIdOrderBySentAtDesc(batchId));
        Collections.reverse(messages);
        return messages.stream().map(this::view).toList();
    }

    @PostMapping("/batches/{batchId}")
    public ChatView send(@PathVariable Long batchId, @Valid @RequestBody ChatRequest request) {
        User user = currentUserService.get();
        accessService.requireBatchAccess(user, batchId);
        Batch batch = batchRepository.findById(batchId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Batch not found"));
        GroupMessage message = new GroupMessage();
        message.setBatch(batch);
        message.setSender(user);
        message.setContent(request.content().trim());
        return view(messageRepository.save(message));
    }

    private ChatView view(GroupMessage message) {
        return new ChatView(message.getId(), message.getBatch().getId(), UserView.from(message.getSender()),
                message.getContent(), message.getSentAt());
    }
}
