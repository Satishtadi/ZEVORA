package com.zevora.user;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import com.zevora.common.Enums.Role;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface UserRepository extends JpaRepository<User, UUID> {
    Optional<User> findByEmailIgnoreCase(String email);
    Optional<User> findByPhone(String phone);
    boolean existsByEmailIgnoreCase(String email);
    boolean existsByPhone(String phone);

    List<User> findByRoleIn(Collection<Role> roles);

    @Query("""
            select u from User u
            where (:q is null or :q = ''
               or lower(u.fullName) like lower(concat('%', :q, '%'))
               or lower(u.email) like lower(concat('%', :q, '%'))
               or u.phone like concat('%', :q, '%'))
            """)
    Page<User> search(@Param("q") String q, Pageable pageable);
}

