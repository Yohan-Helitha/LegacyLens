package lk.ac.sliit.legacylens.admin.service;

import lk.ac.sliit.legacylens.admin.dto.AdminWordOfTheDayResponse;
import lk.ac.sliit.legacylens.home.dto.WordOfTheDayRequest;

import java.util.List;

public interface AdminWordOfTheDayService {
    List<AdminWordOfTheDayResponse> getAllWords();

    AdminWordOfTheDayResponse createWord(WordOfTheDayRequest request,
            String performedById, String performedByName);

    AdminWordOfTheDayResponse updateWord(Long id, WordOfTheDayRequest request,
            String performedById, String performedByName);

    void deleteWord(Long id, String performedById, String performedByName);
}
