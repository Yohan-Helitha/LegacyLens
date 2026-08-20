package lk.ac.sliit.legacylens.users.controller;

import lk.ac.sliit.legacylens.common.dto.ApiResponse;
import lk.ac.sliit.legacylens.users.dto.CityDto;
import lk.ac.sliit.legacylens.users.service.CityService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * Public — the city list is needed on the signup form before the user has
 * an account or a token (see SecurityConfig for the permitAll rule).
 */
@RestController
@RequestMapping("/api/cities")
public class CityController {

    private final CityService cityService;

    public CityController(CityService cityService) {
        this.cityService = cityService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<CityDto>>> getAllCities() {
        return ResponseEntity.ok(ApiResponse.ok(cityService.getAllCities()));
    }
}
