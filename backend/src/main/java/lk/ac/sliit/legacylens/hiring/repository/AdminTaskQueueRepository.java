package lk.ac.sliit.legacylens.hiring.repository;

import lk.ac.sliit.legacylens.hiring.entity.AdminTaskQueueEntry;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface AdminTaskQueueRepository extends JpaRepository<AdminTaskQueueEntry, UUID> {
}
