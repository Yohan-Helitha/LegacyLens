package lk.ac.sliit.legacylens.users.service;

import lk.ac.sliit.legacylens.users.dto.UpdateProfileRequest;
import lk.ac.sliit.legacylens.users.dto.UserProfileResponse;

import org.springframework.web.multipart.MultipartFile;

import java.util.UUID;

public interface UserProfileService {

    UserProfileResponse getMyProfile(UUID userId);

    UserProfileResponse updateMyProfile(UUID userId, UpdateProfileRequest request);

    /** Replaces the user's profile picture with the uploaded image and returns the updated profile. */
    UserProfileResponse updateProfilePhoto(UUID userId, MultipartFile photo);

    /** Idempotent — safe to call again once already true. */
    void markTutorialComplete(UUID userId);
}
