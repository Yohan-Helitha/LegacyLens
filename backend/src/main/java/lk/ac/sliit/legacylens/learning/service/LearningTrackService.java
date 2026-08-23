package lk.ac.sliit.legacylens.learning.service;

import lk.ac.sliit.legacylens.learning.entity.LearningTrack;
import lk.ac.sliit.legacylens.learning.repository.LearningTrackRepository;
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
}