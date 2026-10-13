package lk.ac.sliit.legacylens.marketplace.service;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class CreatorProfileResponseMapperTest {

    @Test
    void maskNic_showsOnlyTheFirstTwoAndLastTwoCharacters() {
        assertThat(CreatorProfileResponseMapper.maskNic("200272401447")).isEqualTo("20XXXXXXXX47");
        assertThat(CreatorProfileResponseMapper.maskNic("981234567V")).isEqualTo("98XXXXXX7V");
    }

    @Test
    void maskNic_handlesMissingAndVeryShortValues() {
        assertThat(CreatorProfileResponseMapper.maskNic(null)).isNull();
        assertThat(CreatorProfileResponseMapper.maskNic("  ")).isNull();
        assertThat(CreatorProfileResponseMapper.maskNic("1234")).isEqualTo("XXXX");
    }
}
