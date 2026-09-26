package lk.ac.sliit.legacylens.admin.validation.opportunity;

import lk.ac.sliit.legacylens.admin.dto.UpdateOpportunityStatusRequest;
import org.springframework.stereotype.Component;
import org.springframework.validation.Errors;
import org.springframework.validation.Validator;

@Component
public class OpportunityStatusFormValidator implements Validator {

    @Override
    public boolean supports(Class<?> clazz) {
        return UpdateOpportunityStatusRequest.class.equals(clazz);
    }

    @Override
    public void validate(Object target, Errors errors) {
        UpdateOpportunityStatusRequest request = (UpdateOpportunityStatusRequest) target;

        if (request.getStatus() == null || request.getStatus().trim().isEmpty()) {
            errors.rejectValue("status", "field.required", "Status is required");
            return;
        }

        String status = request.getStatus().trim().toUpperCase();
        if (!status.equals("DRAFT") && !status.equals("PUBLISHED") &&
            !status.equals("ARCHIVED") && !status.equals("CLOSED") &&
            !status.equals("ACTIVE") && !status.equals("INACTIVE")) {
            errors.rejectValue("status", "field.invalid",
                    "Status must be one of: DRAFT, PUBLISHED, ARCHIVED, CLOSED, ACTIVE, INACTIVE");
        }
    }
}
