package lk.ac.sliit.legacylens.admin.validation.map;

import lk.ac.sliit.legacylens.admin.dto.AdminLandmarkRequest;
import org.springframework.stereotype.Component;
import org.springframework.validation.Errors;
import org.springframework.validation.Validator;

@Component
public class MapLandmarkFormValidator implements Validator {

    @Override
    public boolean supports(Class<?> clazz) {
        return AdminLandmarkRequest.class.equals(clazz);
    }

    @Override
    public void validate(Object target, Errors errors) {
        AdminLandmarkRequest request = (AdminLandmarkRequest) target;

        if (request.getName() == null || request.getName().trim().isEmpty()) {
            errors.rejectValue("name", "field.required", "Landmark name is required");
        } else if (request.getName().length() > 200) {
            errors.rejectValue("name", "field.invalid", "Landmark name must not exceed 200 characters");
        }

        if (request.getRegion() == null || request.getRegion().trim().isEmpty()) {
            errors.rejectValue("region", "field.required", "Region is required");
        }

        if (request.getLatitude() != null) {
            if (request.getLatitude() < -90 || request.getLatitude() > 90) {
                errors.rejectValue("latitude", "field.invalid", "Latitude must be between -90 and 90");
            }
        }

        if (request.getLongitude() != null) {
            if (request.getLongitude() < -180 || request.getLongitude() > 180) {
                errors.rejectValue("longitude", "field.invalid", "Longitude must be between -180 and 180");
            }
        }
    }
}
