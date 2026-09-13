package lk.ac.sliit.legacylens.stories.service;

import lk.ac.sliit.legacylens.stories.dto.CreateStoryRequest;
import lk.ac.sliit.legacylens.stories.dto.StoryResponse;
import lk.ac.sliit.legacylens.stories.dto.UpdateStoryRequest;

import java.util.List;
import java.util.UUID;

public interface StoryService {

    /** Only callable by users holding the ELDER role. */
    StoryResponse create(UUID userId, CreateStoryRequest request);

    /** The caller's own stories, newest first. */
    List<StoryResponse> listMine(UUID userId);

    /** Throws if the story doesn't exist or isn't owned by the caller. */
    StoryResponse getById(UUID userId, UUID storyId);

    /** Updates title/description on an existing story. Owner-only; media isn't editable. */
    StoryResponse update(UUID userId, UUID storyId, UpdateStoryRequest request);

    /** Deletes the story and its media file (if any). Owner-only. */
    void delete(UUID userId, UUID storyId);
}
