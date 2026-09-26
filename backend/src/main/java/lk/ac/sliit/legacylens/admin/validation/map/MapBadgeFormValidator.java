package lk.ac.sliit.legacylens.admin.validation.map;

import lk.ac.sliit.legacylens.admin.dto.AdminBadgeRequest;
import org.springframework.stereotype.Component;
import org.springframework.validation.Errors;
import org.springframework.validation.Validator;

@Component
public class MapBadgeFormValidator implements Validator {

    @Override
    public boolean supports(Class<?> clazz) {
        return AdminBadgeRequest.class.equals(clazz);
    }

    @Override
    public void validate(Object target, Errors errors) {
        AdminBadgeRequest request = (AdminBadgeRequest) target;

        if (request.getBadgeCode() == null || request.getBadgeCode().trim().isEmpty()) {
            errors.rejectValue("badgeCode", "field.required", "Badge code is required");
        } else if (request.getBadgeCode().length() > 100) {
            errors.rejectValue("badgeCode", "field.invalid", "Badge code must not exceed 100 characters");
        }

        if (request.getTitle() == null || request.getTitle().trim().isEmpty()) {
            errors.rejectValue("title", "field.required", "Badge title is required");
        } else if (request.getTitle().length() > 200) {
            errors.rejectValue("title", "field.invalid", "Badge title must not exceed 200 characters");
        }
    }
}
