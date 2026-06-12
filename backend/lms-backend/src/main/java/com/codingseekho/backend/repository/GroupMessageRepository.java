package com.codingseekho.backend.repository;

import com.codingseekho.backend.entity.GroupMessage;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface GroupMessageRepository extends JpaRepository<GroupMessage, Long> {
    List<GroupMessage> findTop100ByBatchIdOrderBySentAtDesc(Long batchId);
}
