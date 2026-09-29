package lk.ac.sliit.legacylens.admin.service;

import lk.ac.sliit.legacylens.admin.dto.AdminWordOfTheDayResponse;
import lk.ac.sliit.legacylens.admin.entity.AuditActionType;
import lk.ac.sliit.legacylens.common.exception.ResourceNotFoundException;
import lk.ac.sliit.legacylens.home.dto.WordOfTheDayRequest;
import lk.ac.sliit.legacylens.home.entity.WordOfTheDay;
import lk.ac.sliit.legacylens.home.repository.WordOfTheDayRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AdminWordOfTheDayServiceImpl implements AdminWordOfTheDayService {

    private final WordOfTheDayRepository repository;
    private final AdminAuditService auditService;

    @Override
    @Transactional(readOnly = true)
    public List<AdminWordOfTheDayResponse> getAllWords() {
        return repository.findAll(Sort.by(Sort.Direction.DESC, "activeDate"))
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public AdminWordOfTheDayResponse createWord(WordOfTheDayRequest request,
            String performedById, String performedByName) {
        WordOfTheDay entity = new WordOfTheDay();
        applyRequest(entity, request);
        AdminWordOfTheDayResponse result = mapToResponse(repository.save(entity));
        auditService.logAction(AuditActionType.CREATED, "Word of the Day",
                result.getId() != null ? result.getId().toString() : null,
                request.getWord(), performedById, performedByName,
                "New word added for date: " + request.getActiveDate());
        return result;
    }

    @Override
    @Transactional
    public AdminWordOfTheDayResponse updateWord(Long id, WordOfTheDayRequest request,
            String performedById, String performedByName) {
        WordOfTheDay entity = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Word of the day not found with id " + id));
        applyRequest(entity, request);
        AdminWordOfTheDayResponse result = mapToResponse(repository.save(entity));
        auditService.logAction(AuditActionType.UPDATED, "Word of the Day",
                id.toString(), request.getWord(), performedById, performedByName,
                "Word entry updated");
        return result;
    }

    @Override
    @Transactional
    public void deleteWord(Long id, String performedById, String performedByName) {
        WordOfTheDay entity = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Word of the day not found with id " + id));
        String wordTitle = entity.getWord();
        repository.deleteById(id);
        auditService.logAction(AuditActionType.DELETED, "Word of the Day",
                id.toString(), wordTitle, performedById, performedByName,
                "Word entry permanently deleted");
    }

    // --- Helpers ---

    private void applyRequest(WordOfTheDay entity, WordOfTheDayRequest req) {
        entity.setLanguage(req.getLanguage() != null && !req.getLanguage().isBlank() ? req.getLanguage() : "Sinhala");
        entity.setWord(req.getWord());
        entity.setTransliteration(req.getTransliteration());
        entity.setDefinition(req.getDefinition());
        entity.setPartOfSpeech(req.getPartOfSpeech());
        entity.setAudioFilename(req.getAudioFilename());
        entity.setActiveDate(req.getActiveDate());
        if (req.getStatus() != null && !req.getStatus().isBlank()) {
            entity.setStatus(req.getStatus());
        }
    }

    private AdminWordOfTheDayResponse mapToResponse(WordOfTheDay entity) {
        return AdminWordOfTheDayResponse.builder()
                .id(entity.getId())
                .language(entity.getLanguage())
                .word(entity.getWord())
                .transliteration(entity.getTransliteration())
                .definition(entity.getDefinition())
                .partOfSpeech(entity.getPartOfSpeech())
                .audioFilename(entity.getAudioFilename())
                .activeDate(entity.getActiveDate())
                .status(entity.getStatus())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .build();
    }
}
