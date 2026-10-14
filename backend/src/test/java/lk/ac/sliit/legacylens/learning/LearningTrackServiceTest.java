package lk.ac.sliit.legacylens.learning;

import lk.ac.sliit.legacylens.learning.entity.LearningTrack;
import lk.ac.sliit.legacylens.learning.repository.LearningTrackRepository;
import lk.ac.sliit.legacylens.learning.service.LearningTrackService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class LearningTrackServiceTest {

	@Mock
	private LearningTrackRepository learningTrackRepository;

	private LearningTrackService learningTrackService;

	@BeforeEach
	void setUp() {
		learningTrackService = new LearningTrackService(learningTrackRepository);
	}

	@Test
	@DisplayName("Returns only tracks with origin ADMIN and visibility PUBLIC")
	void testGetAllTracksFiltersByAdminAndPublic() {
		LearningTrack adminTrack = new LearningTrack();
		adminTrack.setId(1L);
		adminTrack.setTitle("Admin Track");
		adminTrack.setOrigin("ADMIN");
		adminTrack.setVisibility("PUBLIC");
		List<LearningTrack> results = null;

		when(learningTrackRepository.findByOriginAndVisibilityOrderByCreatedAtDesc("ADMIN", "PUBLIC"))
				.thenReturn(List.of(adminTrack));

		results = learningTrackService.getAllTracks();

		assertEquals(1, results.size());
		assertEquals("ADMIN", results.get(0).getOrigin());
		verify(learningTrackRepository).findByOriginAndVisibilityOrderByCreatedAtDesc("ADMIN", "PUBLIC");
		verify(learningTrackRepository, never()).findAll();
	}

	@Test
	@DisplayName("Defaults origin to ADMIN and visibility to PUBLIC when creating a track")
	void testCreateTrackDefaults() {
		LearningTrack input = new LearningTrack();
		input.setTitle("New Track");
		ArgumentCaptor<LearningTrack> captor = ArgumentCaptor.forClass(LearningTrack.class);

		when(learningTrackRepository.save(any(LearningTrack.class))).thenAnswer(inv -> inv.getArgument(0));

		learningTrackService.createTrack(input);

		verify(learningTrackRepository).save(captor.capture());
		assertEquals("ADMIN", captor.getValue().getOrigin());
		assertEquals("PUBLIC", captor.getValue().getVisibility());
	}
}
