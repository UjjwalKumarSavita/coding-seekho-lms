package com.codingseekho.backend.repository;

import com.codingseekho.backend.entity.Batch;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface BatchRepository extends JpaRepository<Batch, Long> {
    Optional<Batch> findByCodeIgnoreCase(String code);
    boolean existsByCodeIgnoreCase(String code);
}
