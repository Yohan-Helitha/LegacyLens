package lk.ac.sliit.legacylens.home.repository;

import lk.ac.sliit.legacylens.home.entity.WordOfTheDay;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.Optional;

@Repository
public interface WordOfTheDayRepository extends JpaRepository<WordOfTheDay, Long> {

    /** Returns the entry whose active_date equals the given date. */
    Optional<WordOfTheDay> findByActiveDate(LocalDate date);

    /** Fallback: Get the latest word of the day available. */
    Optional<WordOfTheDay> findFirstByOrderByActiveDateDesc();
}
