package lk.ac.sliit.legacylens.admin.validation.map;

import lk.ac.sliit.legacylens.admin.dto.AdminQuestRequest;
import org.springframework.stereotype.Component;
import org.springframework.validation.Errors;
import org.springframework.validation.Validator;

@Component
public class MapQuestFormValidator implements Validator {

    @Override
    public boolean supports(Class<?> clazz) {
        return AdminQuestRequest.class.equals(clazz);
    }

    @Override
    public void validate(Object target, Errors errors) {
        AdminQuestRequest request = (AdminQuestRequest) target;

        if (request.getTitle() == null || request.getTitle().trim().isEmpty()) {
            errors.rejectValue("title", "field.required", "Quest title is required");
        } else if (request.getTitle().length() > 200) {
            errors.rejectValue("title", "field.invalid", "Quest title must not exceed 200 characters");
        }

        if (request.getDescription() != null && request.getDescription().length() > 1000) {
            errors.rejectValue("description", "field.invalid", "Description must not exceed 1000 characters");
        }

        if (request.getQuestions() == null || request.getQuestions().isEmpty()) {
            errors.rejectValue("questions", "field.required", "At least one question is required");
        }
    }
}
