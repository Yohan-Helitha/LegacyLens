package lk.ac.sliit.legacylens.users.repository;

import lk.ac.sliit.legacylens.users.entity.City;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CityRepository extends JpaRepository<City, Integer> {

    /** Returns all cities sorted alphabetically by name used by the city dropdown. */
    List<City> findAllByOrderByNameAsc();
}
