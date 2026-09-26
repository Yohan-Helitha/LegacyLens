package lk.ac.sliit.legacylens.admin.validation.opportunity;

import lk.ac.sliit.legacylens.admin.dto.CreateOpportunityRequest;
import org.springframework.stereotype.Component;
import org.springframework.validation.Errors;
import org.springframework.validation.Validator;

@Component
public class OpportunityIntakeFormValidator implements Validator {

    @Override
    public boolean supports(Class<?> clazz) {
        return CreateOpportunityRequest.class.equals(clazz);
    }

    @Override
    public void validate(Object target, Errors errors) {
        CreateOpportunityRequest request = (CreateOpportunityRequest) target;

        if (request.getTitle() != null && request.getTitle().length() > 200) {
            errors.rejectValue("title", "field.invalid", "Title must not exceed 200 characters");
        }

        if (request.getHeroImageUrl() != null && request.getHeroImageUrl().length() > 500) {
            errors.rejectValue("heroImageUrl", "field.invalid", "Hero image URL must not exceed 500 characters");
        }

        if (request.getLocation() != null && request.getLocation().length() > 150) {
            errors.rejectValue("location", "field.invalid", "Location must not exceed 150 characters");
        }

        if (request.getCategory() != null && request.getCategory().length() > 50) {
            errors.rejectValue("category", "field.invalid", "Category must not exceed 50 characters");
        }

        if (request.getDurationText() != null && request.getDurationText().length() > 50) {
            errors.rejectValue("durationText", "field.invalid", "Duration text must not exceed 50 characters");
        }

        if (request.getTimeWindowText() != null && request.getTimeWindowText().length() > 50) {
            errors.rejectValue("timeWindowText", "field.invalid", "Time window text must not exceed 50 characters");
        }

        if (request.getStatus() != null && request.getStatus().length() > 20) {
            errors.rejectValue("status", "field.invalid", "Status must not exceed 20 characters");
        }

        if (request.getElderName() != null && request.getElderName().length() > 150) {
            errors.rejectValue("elderName", "field.invalid", "Elder name must not exceed 150 characters");
        }
    }
}
