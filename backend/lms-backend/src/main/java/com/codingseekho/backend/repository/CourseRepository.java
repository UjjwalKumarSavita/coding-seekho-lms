package com.codingseekho.backend.repository;

import com.codingseekho.backend.entity.Course;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface CourseRepository extends JpaRepository<Course, Long> {
    List<Course> findByBatchIdAndActiveTrueOrderByName(Long batchId);
}
