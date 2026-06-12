package com.codingseekho.backend.service;

import com.codingseekho.backend.entity.*;
import com.codingseekho.backend.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
@RequiredArgsConstructor
public class NotificationService {
    private final NotificationRepository notificationRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final ObjectProvider<JavaMailSender> mailSenderProvider;

    @Value("${app.mail.enabled:false}")
    private boolean mailEnabled;

    @Value("${app.mail.from}")
    private String from;

    public void notifyUser(User user, String title, String message, String type, String actionUrl, boolean email) {
        Notification notification = new Notification();
        notification.setUser(user);
        notification.setTitle(title);
        notification.setMessage(message);
        notification.setType(type);
        notification.setActionUrl(actionUrl);
        notificationRepository.save(notification);
        if (email && mailEnabled) sendEmail(user.getEmail(), title, message);
    }

    public void notifyBatch(Long batchId, String title, String message, String type, String actionUrl) {
        List<Enrollment> members = enrollmentRepository.findByBatchIdAndStatus(batchId, EnrollmentStatus.ACTIVE);
        members.forEach(member -> notifyUser(member.getUser(), title, message, type, actionUrl, true));
    }

    public void sendEmail(String to, String subject, String body) {
        if (!mailEnabled) return;
        SimpleMailMessage mail = new SimpleMailMessage();
        mail.setFrom(from);
        mail.setTo(to);
        mail.setSubject(subject);
        mail.setText(body);
        JavaMailSender mailSender = mailSenderProvider.getIfAvailable();
        if (mailSender != null) mailSender.send(mail);
    }
}
