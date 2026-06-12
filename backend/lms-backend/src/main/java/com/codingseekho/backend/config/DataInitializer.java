package com.codingseekho.backend.config;

import com.codingseekho.backend.entity.*;
import com.codingseekho.backend.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;
import java.time.LocalDate;
import java.util.List;

@Configuration
@RequiredArgsConstructor
public class DataInitializer {
    private final UserRepository userRepository;
    private final BatchRepository batchRepository;
    private final CourseRepository courseRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.bootstrap.admin-name:LLC Administrator}")
    private String adminName;

    @Value("${app.bootstrap.admin-email:}")
    private String adminEmail;

    @Value("${app.bootstrap.admin-password:}")
    private String adminPassword;

    @Bean
    CommandLineRunner seedLlcData() {
        return args -> {
            migrateExistingUsers();
            createBootstrapAdmin();

            Batch batch = batchRepository.findByCodeIgnoreCase("LLC-WEB-01").orElseGet(() -> {
                Batch value = new Batch();
                value.setName("Full Stack Web Development");
                value.setCode("LLC-WEB-01");
                value.setDescription("React, Spring Boot, PostgreSQL and product development.");
                return batchRepository.save(value);
            });

            if (courseRepository.findByBatchIdAndActiveTrueOrderByName(batch.getId()).isEmpty()) {
                createCourse(batch, "Frontend with React", "LLC-REACT");
                createCourse(batch, "Spring Boot REST APIs", "LLC-SPRING");
                createCourse(batch, "PostgreSQL Fundamentals", "LLC-PG");
            }
        };
    }

    private void createBootstrapAdmin() {
        if (adminEmail.isBlank() || adminPassword.isBlank()) {
            return;
        }
        if (adminPassword.length() < 12) {
            throw new IllegalStateException("BOOTSTRAP_ADMIN_PASSWORD must contain at least 12 characters");
        }
        createUser(adminName, adminEmail.trim().toLowerCase(), adminPassword, Role.ADMIN);
    }

    private void migrateExistingUsers() {
        List<User> users = userRepository.findAll();
        users.forEach(user -> {
            boolean changed = false;
            if (user.getRole() == null) {
                user.setRole(Role.STUDENT);
                changed = true;
            }
            if (user.getEnabled() == null) {
                user.setEnabled(true);
                changed = true;
            }
            if (user.getJoinedAt() == null) {
                user.setJoinedAt(LocalDate.now().toString());
                changed = true;
            }
            if (user.getPassword() != null && !user.getPassword().startsWith("$2")) {
                user.setPassword(passwordEncoder.encode(user.getPassword()));
                changed = true;
            }
            if (changed) userRepository.save(user);
        });
    }

    private User createUser(String name, String email, String password, Role role) {
        return userRepository.findByEmailIgnoreCase(email).orElseGet(() -> {
            User user = new User();
            user.setUsername(name);
            user.setEmail(email);
            user.setPassword(passwordEncoder.encode(password));
            user.setRole(role);
            user.setEnabled(true);
            return userRepository.save(user);
        });
    }

    private void createCourse(Batch batch, String name, String code) {
        Course course = new Course();
        course.setBatch(batch);
        course.setName(name);
        course.setCode(code);
        course.setDescription("LLC World learning module");
        courseRepository.save(course);
    }
}
