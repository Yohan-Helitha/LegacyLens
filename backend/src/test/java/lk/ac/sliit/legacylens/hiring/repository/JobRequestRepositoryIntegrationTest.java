package lk.ac.sliit.legacylens.hiring.repository;

import lk.ac.sliit.legacylens.hiring.dto.JobRequestSummaryDto;
import lk.ac.sliit.legacylens.hiring.entity.InputMode;
import lk.ac.sliit.legacylens.hiring.entity.JobApplication;
import lk.ac.sliit.legacylens.hiring.entity.JobRequest;
import lk.ac.sliit.legacylens.hiring.entity.JobRequestStatus;
import lk.ac.sliit.legacylens.users.entity.User;
import lk.ac.sliit.legacylens.users.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.autoconfigure.orm.jpa.TestEntityManager;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.tuple;

@DataJpaTest
class JobRequestRepositoryIntegrationTest {

    @Autowired
    private JobRequestRepository jobRequestRepository;

    @Autowired
    private JobApplicationRepository jobApplicationRepository;

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

    private JobRequest persistJobRequest(User elder, String title, JobRequestStatus status) {
        JobRequest jobRequest = new JobRequest();
        jobRequest.setElder(elder);
        jobRequest.setTitle(title);
        jobRequest.setDescription("Some description");
        jobRequest.setInputMode(InputMode.TEXT);
        jobRequest.setStatus(status);
        return jobRequestRepository.save(jobRequest);
    }

    private void persistApplication(JobRequest jobRequest, User creator) {
        JobApplication application = new JobApplication();
        application.setJobRequest(jobRequest);
        application.setCreator(creator);
        jobApplicationRepository.save(application);
    }

    @Test
    void getMyRequests_includesApplicantCount() {
        User elder = persistUser("+94770005001");
        JobRequest jobRequest = persistJobRequest(elder, "Film my pottery", JobRequestStatus.PUBLISHED);
        persistApplication(jobRequest, persistUser("+94770005002"));
        persistApplication(jobRequest, persistUser("+94770005003"));
        entityManager.flush();
        entityManager.clear();

        List<JobRequestSummaryDto> results = jobRequestRepository.findSummariesByElderId(elder.getId(), null);

        assertThat(results).hasSize(1);
        assertThat(results.get(0).getApplicantCount()).isEqualTo(2L);
    }

    @Test
    void getMyRequests_statusFilter_returnsOnlyMatching() {
        User elder = persistUser("+94770005004");
        persistJobRequest(elder, "Draft request", JobRequestStatus.DRAFT);
        persistJobRequest(elder, "Published request", JobRequestStatus.PUBLISHED);
        entityManager.flush();
        entityManager.clear();

        List<JobRequestSummaryDto> results = jobRequestRepository.findSummariesByElderId(elder.getId(), JobRequestStatus.PUBLISHED);

        assertThat(results).extracting(JobRequestSummaryDto::getTitle).containsExactly("Published request");
    }

    @Test
    void getMyRequests_noStatusFilter_returnsEveryStatus() {
        User elder = persistUser("+94770005005");
        persistJobRequest(elder, "Draft request", JobRequestStatus.DRAFT);
        persistJobRequest(elder, "Published request", JobRequestStatus.PUBLISHED);
        entityManager.flush();
        entityManager.clear();

        List<JobRequestSummaryDto> results = jobRequestRepository.findSummariesByElderId(elder.getId(), null);

        assertThat(results).extracting(JobRequestSummaryDto::getTitle, r -> r.getApplicantCount())
                .containsExactlyInAnyOrder(tuple("Draft request", 0L), tuple("Published request", 0L));
    }

    @Test
    void getMyRequests_excludesOtherEldersRequests() {
        User elder = persistUser("+94770005006");
        User otherElder = persistUser("+94770005007");
        persistJobRequest(elder, "Mine", JobRequestStatus.PUBLISHED);
        persistJobRequest(otherElder, "Not mine", JobRequestStatus.PUBLISHED);
        entityManager.flush();
        entityManager.clear();

        List<JobRequestSummaryDto> results = jobRequestRepository.findSummariesByElderId(elder.getId(), null);

        assertThat(results).extracting(JobRequestSummaryDto::getTitle).containsExactly("Mine");
    }
}
