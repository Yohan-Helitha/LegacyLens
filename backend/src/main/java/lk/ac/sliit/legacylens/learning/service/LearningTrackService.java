package lk.ac.sliit.legacylens.learning.service;

import lk.ac.sliit.legacylens.learning.entity.LearningTrack;
import lk.ac.sliit.legacylens.learning.repository.LearningTrackRepository;

import lk.ac.sliit.legacylens.common.exception.ResourceNotFoundException;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class LearningTrackService {

    private final LearningTrackRepository learningTrackRepository;

    public LearningTrackService(
            LearningTrackRepository learningTrackRepository) {

        this.learningTrackRepository = learningTrackRepository;
    }

    public List<LearningTrack> getAllTracks() {
        return learningTrackRepository.findAll();
    }

    public Optional<LearningTrack> getTrackById(Long id) {
        return learningTrackRepository.findById(id);
    }

    public LearningTrack createTrack(LearningTrack learningTrack) {
        return learningTrackRepository.save(learningTrack);
    }

    public LearningTrack updateTrack(Long id, LearningTrack updatedTrack) {
        return learningTrackRepository.findById(id).map(existingTrack -> {
            existingTrack.setTitle(updatedTrack.getTitle());
            existingTrack.setDescription(updatedTrack.getDescription());
            existingTrack.setRegion(updatedTrack.getRegion());
            existingTrack.setOccupation(updatedTrack.getOccupation());
            existingTrack.setDifficultyLevel(updatedTrack.getDifficultyLevel());
            existingTrack.setThumbnailUrl(updatedTrack.getThumbnailUrl());
            return learningTrackRepository.save(existingTrack);
        }).orElseThrow(() -> new ResourceNotFoundException("Learning track not found"));
    }

    public void deleteTrack(Long id) {
        if (!learningTrackRepository.existsById(id)) {
            throw new ResourceNotFoundException("Learning track not found");
        }
        learningTrackRepository.deleteById(id);
    }
}