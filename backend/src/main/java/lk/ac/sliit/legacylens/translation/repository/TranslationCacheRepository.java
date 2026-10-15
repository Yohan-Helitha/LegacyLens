package lk.ac.sliit.legacylens.translation.repository;

import lk.ac.sliit.legacylens.translation.entity.TranslationCacheEntry;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.UUID;

@Repository
public interface TranslationCacheRepository extends JpaRepository<TranslationCacheEntry, UUID> {

    List<TranslationCacheEntry> findByTargetLanguageAndSourceHashIn(String targetLanguage, Collection<String> sourceHashes);
}
