package com.codingseekho.backend.controller;

import com.codingseekho.backend.dto.ApiDtos.CourseView;
import com.codingseekho.backend.repository.CourseRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/public")
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CatalogController {
    private final CourseRepository courseRepository;

    @GetMapping("/courses")
    public List<CourseView> courses() {
        return courseRepository.findAll().stream().filter(course -> course.isActive() && course.getBatch().isActive())
                .map(course -> new CourseView(course.getId(), course.getBatch().getId(), course.getName(),
                        course.getCode(), course.getDescription(), true)).toList();
    }
}
