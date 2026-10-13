package lk.ac.sliit.legacylens.learning.service;

import lk.ac.sliit.legacylens.common.exception.ResourceNotFoundException;
import lk.ac.sliit.legacylens.learning.entity.LearningTrack;
import lk.ac.sliit.legacylens.learning.repository.LearningTrackRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class LearningTrackService {

	private final LearningTrackRepository learningTrackRepository;

	public LearningTrackService(LearningTrackRepository learningTrackRepository) {
		this.learningTrackRepository = learningTrackRepository;
	}

	public List<LearningTrack> getAllTracks() {
		List<LearningTrack> tracks = learningTrackRepository
				.findByOriginAndVisibilityOrderByCreatedAtDesc("ADMIN", "PUBLIC");

		return tracks;
	}

	public Optional<LearningTrack> getTrackById(Long id) {
		Optional<LearningTrack> track = learningTrackRepository.findById(id);

		return track;
	}

	public LearningTrack createTrack(LearningTrack learningTrack) {
		LearningTrack savedTrack = null;

		if (learningTrack.getOrigin() == null) {
			learningTrack.setOrigin("ADMIN");
		}
		if (learningTrack.getVisibility() == null) {
			learningTrack.setVisibility("PUBLIC");
		}

		savedTrack = learningTrackRepository.save(learningTrack);

		return savedTrack;
	}

	public LearningTrack updateTrack(Long id, LearningTrack updatedTrack) {
		LearningTrack savedTrack = learningTrackRepository.findById(id).map(existingTrack -> {
			existingTrack.setTitle(updatedTrack.getTitle());
			existingTrack.setDescription(updatedTrack.getDescription());
			existingTrack.setRegion(updatedTrack.getRegion());
			existingTrack.setOccupation(updatedTrack.getOccupation());
			existingTrack.setDifficultyLevel(updatedTrack.getDifficultyLevel());
			existingTrack.setThumbnailUrl(updatedTrack.getThumbnailUrl());
			return learningTrackRepository.save(existingTrack);
		}).orElseThrow(() -> new ResourceNotFoundException("Learning track not found"));

		return savedTrack;
	}

	public void deleteTrack(Long id) {
		if (!learningTrackRepository.existsById(id)) {
			throw new ResourceNotFoundException("Learning track not found");
		}

		learningTrackRepository.deleteById(id);
	}
}