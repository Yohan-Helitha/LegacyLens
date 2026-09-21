package lk.ac.sliit.legacylens.contentcapture.repository;

import lk.ac.sliit.legacylens.contentcapture.entity.ElderRating;
import lk.ac.sliit.legacylens.users.entity.User;
import lk.ac.sliit.legacylens.users.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.autoconfigure.orm.jpa.TestEntityManager;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;

import java.time.LocalDate;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.within;

@DataJpaTest
class ElderRatingRepositoryIntegrationTest {

    @Autowired
    private ElderRatingRepository elderRatingRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private TestEntityManager entityManager;

    private User persistUser(String phone) {
        User user = new User();
        user.setFullName("Someone");
        user.setPhoneNumber(phone);
        user.setNicNumber("N" + UUID.randomUUID().toString().replace("-", "").substring(0, 15));
        user.setDateOfBirth(LocalDate.of(1998, 4, 12));
        user.setPinHash("irrelevant-hash");
        return userRepository.save(user);
    }

    private void persistRating(User elder, User ratedBy, int score) {
        ElderRating rating = new ElderRating();
        rating.setElder(elder);
        rating.setRatedBy(ratedBy);
        rating.setScore(score);
        elderRatingRepository.save(rating);
    }

    @Test
    void calculateAverage_multipleRatings_returnsCorrectMean() {
        User elder = persistUser("+94770004001");
        persistRating(elder, persistUser("+94770004002"), 5);
        persistRating(elder, persistUser("+94770004003"), 3);
        persistRating(elder, persistUser("+94770004004"), 4);
        entityManager.flush();
        entityManager.clear();

        Double average = elderRatingRepository.calculateAverageScore(elder.getId());

        assertThat(average).isCloseTo(4.0, within(0.001));
        assertThat(elderRatingRepository.countByElderId(elder.getId())).isEqualTo(3);
    }

    @Test
    void calculateAverage_noRatings_returnsNullOrZero() {
        User elder = persistUser("+94770004005");
        entityManager.flush();
        entityManager.clear();

        Double average = elderRatingRepository.calculateAverageScore(elder.getId());

        assertThat(average).isNull();
        assertThat(elderRatingRepository.countByElderId(elder.getId())).isZero();
    }

    @Test
    void findByElderIdOrderByCreatedAtDesc_newestFirstAndPaginated() throws InterruptedException {
        User elder = persistUser("+94770004006");
        persistRating(elder, persistUser("+94770004007"), 3);
        Thread.sleep(5);
        persistRating(elder, persistUser("+94770004008"), 4);
        Thread.sleep(5);
        persistRating(elder, persistUser("+94770004009"), 5);
        entityManager.flush();
        entityManager.clear();

        Page<ElderRating> firstPage = elderRatingRepository.findByElderIdOrderByCreatedAtDesc(elder.getId(), PageRequest.of(0, 2));

        assertThat(firstPage.getContent()).extracting(ElderRating::getScore).containsExactly(5, 4);
        assertThat(firstPage.getTotalElements()).isEqualTo(3);

        Page<ElderRating> secondPage = elderRatingRepository.findByElderIdOrderByCreatedAtDesc(elder.getId(), PageRequest.of(1, 2));
        assertThat(secondPage.getContent()).extracting(ElderRating::getScore).containsExactly(3);
    }
}
