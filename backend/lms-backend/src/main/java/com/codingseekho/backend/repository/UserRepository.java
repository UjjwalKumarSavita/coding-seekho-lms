package com.codingseekho.backend.repository;

import com.codingseekho.backend.entity.User;
import com.codingseekho.backend.entity.Role;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User,Long> {
    Optional<User> findByEmailIgnoreCase(String email);
    boolean existsByEmailIgnoreCase(String email);
    boolean existsByUsernameIgnoreCase(String username);
    java.util.List<User> findByRoleOrderByUsername(Role role);
}
