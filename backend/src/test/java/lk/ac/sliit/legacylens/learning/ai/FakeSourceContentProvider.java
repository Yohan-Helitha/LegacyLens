package lk.ac.sliit.legacylens.learning.ai;

import lk.ac.sliit.legacylens.learning.ai.source.SourceContent;
import lk.ac.sliit.legacylens.learning.ai.source.SourceContentProvider;
import lk.ac.sliit.legacylens.learning.ai.source.SourceContentSummary;
import lk.ac.sliit.legacylens.learning.ai.source.SourceSearchCriteria;

import java.util.*;

public class FakeSourceContentProvider implements SourceContentProvider {

	private final Map<String, SourceContent> contentMap = new HashMap<>();

	public void addContent(SourceContent content) {
		contentMap.put(content.getId(), content);
	}

	@Override
	public List<SourceContentSummary> search(SourceSearchCriteria criteria) {
		List<SourceContentSummary> list = new ArrayList<>();

		for (SourceContent sc : contentMap.values()) {
			list.add(SourceContentSummary.builder()
					.id(sc.getId())
					.title(sc.getTitle())
					.snippet(sc.getText())
					.region(sc.getRegion())
					.occupation(sc.getOccupation())
					.language(sc.getLanguage())
					.contributorDisplayName(sc.getContributorDisplayName())
					.hasAudio(false)
					.build());
		}

		return list;
	}

	@Override
	public List<SourceContent> findApprovedByIds(List<String> contentIds) {
		List<SourceContent> results = new ArrayList<>();

		if (contentIds != null) {
			for (String id : contentIds) {
				if (contentMap.containsKey(id)) {
					results.add(contentMap.get(id));
				}
			}
		}

		return results;
	}
}
