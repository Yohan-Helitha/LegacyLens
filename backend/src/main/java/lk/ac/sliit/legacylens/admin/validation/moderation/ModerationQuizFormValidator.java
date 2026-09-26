package lk.ac.sliit.legacylens.admin.validation.moderation;

import lk.ac.sliit.legacylens.moderation.dto.AiGenerateQuizRequest;
import org.springframework.stereotype.Component;
import org.springframework.validation.Errors;
import org.springframework.validation.Validator;

@Component
public class ModerationQuizFormValidator implements Validator {

    @Override
    public boolean supports(Class<?> clazz) {
        return AiGenerateQuizRequest.class.equals(clazz);
    }

    @Override
    public void validate(Object target, Errors errors) {
        AiGenerateQuizRequest request = (AiGenerateQuizRequest) target;

        if (request.getTitle() == null || request.getTitle().trim().isEmpty()) {
            errors.rejectValue("title", "field.required", "Quiz title is required");
        } else if (request.getTitle().length() > 200) {
            errors.rejectValue("title", "field.invalid", "Quiz title must not exceed 200 characters");
        }

        if (request.getBodyContent() == null || request.getBodyContent().trim().isEmpty()) {
            errors.rejectValue("bodyContent", "field.required", "Body content is required");
        }

        if (request.getDescription() != null && request.getDescription().length() > 1000) {
            errors.rejectValue("description", "field.invalid", "Description must not exceed 1000 characters");
        }
    }
}
