package lk.ac.sliit.legacylens.admin.validation.word_of_the_day;

import lk.ac.sliit.legacylens.home.dto.WordOfTheDayRequest;
import org.springframework.stereotype.Component;
import org.springframework.validation.Errors;
import org.springframework.validation.Validator;

@Component
public class WordOfTheDayFormValidator implements Validator {

    @Override
    public boolean supports(Class<?> clazz) {
        return WordOfTheDayRequest.class.equals(clazz);
    }

    @Override
    public void validate(Object target, Errors errors) {
        WordOfTheDayRequest request = (WordOfTheDayRequest) target;

        if (request.getWord() == null || request.getWord().trim().isEmpty()) {
            errors.rejectValue("word", "field.required", "Word is required");
        } else if (request.getWord().length() > 100) {
            errors.rejectValue("word", "field.invalid", "Word must not exceed 100 characters");
        }

        if (request.getTransliteration() == null || request.getTransliteration().trim().isEmpty()) {
            errors.rejectValue("transliteration", "field.required", "Transliteration is required");
        } else if (request.getTransliteration().length() > 200) {
            errors.rejectValue("transliteration", "field.invalid", "Transliteration must not exceed 200 characters");
        }

        if (request.getDefinition() == null || request.getDefinition().trim().isEmpty()) {
            errors.rejectValue("definition", "field.required", "Definition is required");
        } else if (request.getDefinition().length() > 500) {
            errors.rejectValue("definition", "field.invalid", "Definition must not exceed 500 characters");
        }

        if (request.getActiveDate() == null) {
            errors.rejectValue("activeDate", "field.required", "Active date is required");
        }
    }
}
