package lk.ac.sliit.legacylens.map.repository;

import lk.ac.sliit.legacylens.map.entity.Landmark;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface LandmarkRepository extends JpaRepository<Landmark, Long> {
    Optional<Landmark> findByCode(String code);
}
