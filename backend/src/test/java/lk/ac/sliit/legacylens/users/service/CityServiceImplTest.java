package lk.ac.sliit.legacylens.users.service;

import lk.ac.sliit.legacylens.users.dto.CityDto;
import lk.ac.sliit.legacylens.users.entity.City;
import lk.ac.sliit.legacylens.users.repository.CityRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Collections;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CityServiceImplTest {

    @Mock
    private CityRepository cityRepository;

    private CityServiceImpl cityService;

    @BeforeEach
    void setUp() {
        cityService = new CityServiceImpl(cityRepository);
    }

    @Test
    void getAllCities_mapsEntitiesToDtosInRepositoryOrder() {
        City colombo = new City();
        colombo.setId(1);
        colombo.setName("Colombo");
        colombo.setRegion("Western");

        City galle = new City();
        galle.setId(2);
        galle.setName("Galle");
        galle.setRegion("Southern");

        when(cityRepository.findAllByOrderByNameAsc()).thenReturn(List.of(colombo, galle));

        List<CityDto> result = cityService.getAllCities();

        assertThat(result).hasSize(2);
        assertThat(result.get(0)).isEqualTo(
                CityDto.builder().id(1).name("Colombo").region("Western").build());
        assertThat(result.get(1)).isEqualTo(
                CityDto.builder().id(2).name("Galle").region("Southern").build());
    }

    @Test
    void getAllCities_noCities_returnsEmptyList() {
        when(cityRepository.findAllByOrderByNameAsc()).thenReturn(Collections.emptyList());

        assertThat(cityService.getAllCities()).isEmpty();
    }
}
