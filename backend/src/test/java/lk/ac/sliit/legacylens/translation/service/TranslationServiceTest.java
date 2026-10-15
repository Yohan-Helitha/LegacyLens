package lk.ac.sliit.legacylens.translation.service;

import lk.ac.sliit.legacylens.common.exception.InvalidRequestException;
import lk.ac.sliit.legacylens.common.exception.TranslationUnavailableException;
import lk.ac.sliit.legacylens.translation.config.TranslationProperties;
import lk.ac.sliit.legacylens.translation.entity.TranslationCacheEntry;
import lk.ac.sliit.legacylens.translation.provider.TranslationProvider;
import lk.ac.sliit.legacylens.translation.repository.TranslationCacheRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.dao.DataIntegrityViolationException;

import java.util.Collections;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class TranslationServiceTest {

    @Mock private TranslationProvider provider;
    @Mock private TranslationCacheRepository cacheRepository;

    private TranslationProperties properties;
    private TranslationService service;

    @BeforeEach
    void setUp() {
        properties = new TranslationProperties();
        properties.setMaxTexts(5);
        properties.setMaxCharsPerText(100);
        service = new TranslationService(provider, cacheRepository, properties);
    }

    @Test
    void cachedTextsAreServedWithoutCallingGoogle() {
        String hash = TranslationService.hash("Hello");
        when(cacheRepository.findByTargetLanguageAndSourceHashIn(eq("si"), any()))
                .thenReturn(List.of(new TranslationCacheEntry(hash, "si", "ආයුබෝවන්")));

        List<String> result = service.translate(List.of("Hello"), "si");

        assertThat(result).containsExactly("ආයුබෝවන්");
        verify(provider, never()).translate(any(), any());
    }

    @Test
    void missesAreTranslatedOnceStoredAndReturnedInOrder() {
        when(cacheRepository.findByTargetLanguageAndSourceHashIn(eq("ta"), any()))
                .thenReturn(List.of(new TranslationCacheEntry(TranslationService.hash("Cached"), "ta", "TA-cached")));
        when(provider.isConfigured()).thenReturn(true);
        when(provider.translate(List.of("Fresh"), "ta")).thenReturn(List.of("TA-fresh"));

        List<String> result = service.translate(List.of("Fresh", "Cached"), "ta");

        assertThat(result).containsExactly("TA-fresh", "TA-cached");
        ArgumentCaptor<TranslationCacheEntry> saved = ArgumentCaptor.forClass(TranslationCacheEntry.class);
        verify(cacheRepository).save(saved.capture());
        assertThat(saved.getValue().getSourceHash()).isEqualTo(TranslationService.hash("Fresh"));
        assertThat(saved.getValue().getTargetLanguage()).isEqualTo("ta");
        assertThat(saved.getValue().getTranslatedText()).isEqualTo("TA-fresh");
    }

    @Test
    void duplicateTextsInOneRequestAreSentToGoogleOnlyOnce() {
        when(cacheRepository.findByTargetLanguageAndSourceHashIn(eq("si"), any())).thenReturn(Collections.emptyList());
        when(provider.isConfigured()).thenReturn(true);
        when(provider.translate(List.of("Same"), "si")).thenReturn(List.of("SI-same"));

        List<String> result = service.translate(List.of("Same", " Same ", "Same"), "si");

        assertThat(result).containsExactly("SI-same", "SI-same", "SI-same");
        verify(provider).translate(List.of("Same"), "si");
    }

    @Test
    void blankAndNullEntriesPassThroughAndCostNothing() {
        List<String> input = new java.util.ArrayList<>();
        input.add("");
        input.add(null);
        input.add("   ");

        List<String> result = service.translate(input, "si");

        assertThat(result).containsExactly("", "", "   ");
        verify(provider, never()).translate(any(), any());
        verify(cacheRepository, never()).findByTargetLanguageAndSourceHashIn(any(), any());
    }

    @Test
    void targetIsCaseInsensitiveButMustBeSupported() {
        when(cacheRepository.findByTargetLanguageAndSourceHashIn(eq("si"), any()))
                .thenReturn(List.of(new TranslationCacheEntry(TranslationService.hash("Hi"), "si", "SI-hi")));

        assertThat(service.translate(List.of("Hi"), " SI ")).containsExactly("SI-hi");
        assertThatThrownBy(() -> service.translate(List.of("Hi"), "fr")).isInstanceOf(InvalidRequestException.class);
        assertThatThrownBy(() -> service.translate(List.of("Hi"), null)).isInstanceOf(InvalidRequestException.class);
    }

    @Test
    void rejectsEmptyOversizedAndTooLongRequests() {
        assertThatThrownBy(() -> service.translate(Collections.emptyList(), "si")).isInstanceOf(InvalidRequestException.class);
        assertThatThrownBy(() -> service.translate(List.of("a", "b", "c", "d", "e", "f"), "si"))
                .isInstanceOf(InvalidRequestException.class);
        assertThatThrownBy(() -> service.translate(List.of("x".repeat(101)), "si")).isInstanceOf(InvalidRequestException.class);
    }

    @Test
    void reportsUnavailableWhenNothingIsCachedAndGoogleIsNotConfigured() {
        when(cacheRepository.findByTargetLanguageAndSourceHashIn(eq("si"), any())).thenReturn(Collections.emptyList());
        when(provider.isConfigured()).thenReturn(false);

        assertThatThrownBy(() -> service.translate(List.of("Hello"), "si")).isInstanceOf(TranslationUnavailableException.class);
    }

    @Test
    void aCacheWriteRaceIsIgnored() {
        when(cacheRepository.findByTargetLanguageAndSourceHashIn(eq("si"), any())).thenReturn(Collections.emptyList());
        when(provider.isConfigured()).thenReturn(true);
        when(provider.translate(List.of("Hello"), "si")).thenReturn(List.of("SI-hello"));
        when(cacheRepository.save(any())).thenThrow(new DataIntegrityViolationException("duplicate"));

        assertThat(service.translate(List.of("Hello"), "si")).containsExactly("SI-hello");
    }

    @Test
    void aMismatchedProviderAnswerIsTreatedAsUnavailable() {
        when(cacheRepository.findByTargetLanguageAndSourceHashIn(eq("si"), any())).thenReturn(Collections.emptyList());
        when(provider.isConfigured()).thenReturn(true);
        when(provider.translate(any(), eq("si"))).thenReturn(List.of("one", "two"));

        assertThatThrownBy(() -> service.translate(List.of("Hello"), "si")).isInstanceOf(TranslationUnavailableException.class);
    }
}
