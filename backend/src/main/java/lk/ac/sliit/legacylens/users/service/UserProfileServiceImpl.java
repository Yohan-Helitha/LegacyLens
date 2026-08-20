package lk.ac.sliit.legacylens.users.service;

import lk.ac.sliit.legacylens.common.exception.ResourceNotFoundException;
import lk.ac.sliit.legacylens.users.dto.CityDto;
import lk.ac.sliit.legacylens.users.dto.CreatorProfileDto;
import lk.ac.sliit.legacylens.users.dto.KnowledgeHolderProfileDto;
import lk.ac.sliit.legacylens.users.dto.UserProfileResponse;
import lk.ac.sliit.legacylens.users.entity.City;
import lk.ac.sliit.legacylens.users.entity.CreatorProfile;
import lk.ac.sliit.legacylens.users.entity.KnowledgeHolderProfile;
import lk.ac.sliit.legacylens.users.entity.RoleStatus;
import lk.ac.sliit.legacylens.users.entity.User;
import lk.ac.sliit.legacylens.users.entity.UserRole;
import lk.ac.sliit.legacylens.users.repository.CreatorProfileRepository;
import lk.ac.sliit.legacylens.users.repository.KnowledgeHolderProfileRepository;
import lk.ac.sliit.legacylens.users.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Builds the full-profile response for the currently authenticated user.
 * Kept separate from AuthService — that module owns login/registration,
 * this one owns reading a user's own data (Single Responsibility).
 */
@Service
public class UserProfileServiceImpl implements UserProfileService {

    private final UserRepository userRepository;
    private final KnowledgeHolderProfileRepository knowledgeHolderProfileRepository;
    private final CreatorProfileRepository creatorProfileRepository;

    public UserProfileServiceImpl(
            UserRepository userRepository,
            KnowledgeHolderProfileRepository knowledgeHolderProfileRepository,
            CreatorProfileRepository creatorProfileRepository) {

        this.userRepository = userRepository;
        this.knowledgeHolderProfileRepository = knowledgeHolderProfileRepository;
        this.creatorProfileRepository = creatorProfileRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public UserProfileResponse getMyProfile(UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        List<String> roleNames = user.getRoles().stream()
                .filter(role -> role.getStatus() == RoleStatus.ACTIVE)
                .map(UserRole::getRoleType)
                .map(Enum::name)
                .collect(Collectors.toList());

        KnowledgeHolderProfileDto knowledgeHolderDto = knowledgeHolderProfileRepository
                .findByUserId(userId)
                .map(this::mapKnowledgeHolder)
                .orElse(null);

        CreatorProfileDto creatorDto = creatorProfileRepository
                .findByUserId(userId)
                .map(this::mapCreator)
                .orElse(null);

        return UserProfileResponse.builder()
                .userId(user.getId())
                .fullName(user.getFullName())
                .phoneNumber(user.getPhoneNumber())
                .phoneVerified(user.isPhoneVerified())
                .dateOfBirth(user.getDateOfBirth())
                .nicNumber(user.getNicNumber())
                .profilePhotoUrl(user.getProfilePhotoUrl())
                .fingerprintEnabled(user.isFingerprintEnabled())
                .accountStatus(user.getAccountStatus().name())
                .city(mapCity(user.getCity()))
                .roles(roleNames)
                .knowledgeHolderProfile(knowledgeHolderDto)
                .creatorProfile(creatorDto)
                .createdAt(user.getCreatedAt())
                .updatedAt(user.getUpdatedAt())
                .build();
    }

    private CityDto mapCity(City city) {
        if (city == null) {
            return null;
        }

        return CityDto.builder()
                .id(city.getId())
                .name(city.getName())
                .region(city.getRegion())
                .build();
    }

    private KnowledgeHolderProfileDto mapKnowledgeHolder(KnowledgeHolderProfile profile) {
        return KnowledgeHolderProfileDto.builder()
                .primaryRegion(profile.getPrimaryRegion())
                .knownTopics(profile.getKnownTopics())
                .trustScore(profile.getTrustScore())
                .bio(profile.getBio())
                .build();
    }

    private CreatorProfileDto mapCreator(CreatorProfile profile) {
        return CreatorProfileDto.builder()
                .skills(profile.getSkills())
                .interests(profile.getInterests())
                .verificationStatus(profile.getVerificationStatus().name())
                .rating(profile.getRating())
                .build();
    }
}
