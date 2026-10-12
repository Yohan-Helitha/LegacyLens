package lk.ac.sliit.legacylens.learning.ai.source;

import lk.ac.sliit.legacylens.moderation.entity.ModerationQueueItem;
import lk.ac.sliit.legacylens.moderation.entity.ModerationStatus;
import lk.ac.sliit.legacylens.moderation.repository.ModerationQueueRepository;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Component
public class StoriesContentSourceAdapter implements SourceContentProvider {

	private final ModerationQueueRepository moderationQueueRepository;

	public StoriesContentSourceAdapter(ModerationQueueRepository moderationQueueRepository) {
		this.moderationQueueRepository = moderationQueueRepository;
	}

	@Override
	public List<SourceContentSummary> search(SourceSearchCriteria criteria) {
		String query = criteria != null && criteria.getQuery() != null ? criteria.getQuery().trim() : null;
		String regionFilter = criteria != null && criteria.getRegion() != null ? criteria.getRegion().trim() : null;
		String occupationFilter = criteria != null && criteria.getOccupation() != null ? criteria.getOccupation().trim()
				: null;
		List<ModerationQueueItem> items = null;
		List<SourceContentSummary> summaries = new ArrayList<>();

		if (query == null || query.isBlank()) {
			items = moderationQueueRepository.findByStatus(ModerationStatus.PUBLISHED);
		} else {
			items = moderationQueueRepository.findByStatus(ModerationStatus.PUBLISHED);
			if (items != null) {
				final String q = query.toLowerCase();
				items = items.stream().filter(item -> {
					boolean matchesTitle = item.getTitle() != null && item.getTitle().toLowerCase().contains(q);
					boolean matchesDesc = item.getDescription() != null && item.getDescription().toLowerCase().contains(q);
					boolean matchesBody = item.getBodyContent() != null && item.getBodyContent().toLowerCase().contains(q);
					boolean matchesAuthor = item.getAuthor() != null && item.getAuthor().getFullName() != null
							&& item.getAuthor().getFullName().toLowerCase().contains(q);
					return matchesTitle || matchesDesc || matchesBody || matchesAuthor;
				}).toList();
			}
		}

		if (items == null) {
			return Collections.emptyList();
		}

		for (ModerationQueueItem item : items) {
			String title = item.getTitle();
			String description = item.getDescription();
			String body = item.getBodyContent();
			String fullText = buildFullText(title, description, body);
			boolean matchesRegion = true;
			boolean matchesOccupation = true;
			String snippet = "";
			boolean hasAudio = false;

			if (fullText.isBlank()) {
				continue;
			}

			if (regionFilter != null && !regionFilter.isBlank()) {
				matchesRegion = item.getRegion() != null && item.getRegion().equalsIgnoreCase(regionFilter);
			}

			if (occupationFilter != null && !occupationFilter.isBlank() && item.getTags() != null) {
				boolean foundTag = false;
				for (String tag : item.getTags()) {
					if (tag != null && tag.equalsIgnoreCase(occupationFilter)) {
						foundTag = true;
						break;
					}
				}
				matchesOccupation = foundTag;
			}

			if (!matchesRegion || !matchesOccupation) {
				continue;
			}

			snippet = description != null && !description.isBlank() ? description : body;
			if (snippet != null && snippet.length() > 140) {
				snippet = snippet.substring(0, 137) + "...";
			}

			hasAudio = item.getType() != null && item.getType().toUpperCase().contains("AUDIO");

			summaries.add(SourceContentSummary.builder()
					.id(item.getId().toString())
					.title(item.getTitle())
					.snippet(snippet != null ? snippet : "")
					.region(item.getRegion() != null ? item.getRegion() : "")
					.occupation(item.getTags() != null && item.getTags().length > 0 ? item.getTags()[0] : "")
					.language("si")
					.contributorDisplayName(item.getAuthorName())
					.hasAudio(hasAudio)
					.build());
		}

		return summaries;
	}

	@Override
	public List<SourceContent> findApprovedByIds(List<String> contentIds) {
		List<SourceContent> approvedContents = new ArrayList<>();

		if (contentIds == null || contentIds.isEmpty()) {
			return approvedContents;
		}

		for (String idStr : contentIds) {
			UUID uuid = null;
			Optional<ModerationQueueItem> itemOpt = Optional.empty();

			try {
				uuid = UUID.fromString(idStr.trim());
			} catch (IllegalArgumentException ex) {
				continue;
			}

			itemOpt = moderationQueueRepository.findByIdAndStatus(uuid, ModerationStatus.PUBLISHED);
			if (itemOpt.isPresent()) {
				ModerationQueueItem item = itemOpt.get();
				String fullText = buildFullText(item.getTitle(), item.getDescription(), item.getBodyContent());

				if (fullText.isBlank()) {
					continue;
				}

				approvedContents.add(SourceContent.builder()
						.id(item.getId().toString())
						.title(item.getTitle())
						.text(fullText)
						.region(item.getRegion() != null ? item.getRegion() : "")
						.occupation(item.getTags() != null && item.getTags().length > 0 ? item.getTags()[0] : "")
						.language("si")
						.audioUrl(item.getMediaFilePath())
						.contributorDisplayName(item.getAuthorName())
						.build());
			}
		}

		return approvedContents;
	}

	private String buildFullText(String title, String description, String bodyContent) {
		StringBuilder sb = new StringBuilder();

		if (title != null && !title.isBlank()) {
			sb.append(title.trim()).append("\n\n");
		}
		if (description != null && !description.isBlank()) {
			sb.append(description.trim()).append("\n\n");
		}
		if (bodyContent != null && !bodyContent.isBlank()) {
			sb.append(bodyContent.trim());
		}

		return sb.toString().trim();
	}
}
