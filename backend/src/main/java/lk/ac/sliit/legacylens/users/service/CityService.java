package lk.ac.sliit.legacylens.users.service;

import lk.ac.sliit.legacylens.users.dto.CityDto;

import java.util.List;

public interface CityService {

    /** All cities, alphabetically by name — backs the signup city picker. */
    List<CityDto> getAllCities();
}
