package lk.ac.sliit.legacylens.users.service;

import lk.ac.sliit.legacylens.users.dto.UpdateProfileRequest;
import lk.ac.sliit.legacylens.users.dto.UserProfileResponse;

import java.util.UUID;

public interface UserProfileService {

    UserProfileResponse getMyProfile(UUID userId);

    UserProfileResponse updateMyProfile(UUID userId, UpdateProfileRequest request);
}
