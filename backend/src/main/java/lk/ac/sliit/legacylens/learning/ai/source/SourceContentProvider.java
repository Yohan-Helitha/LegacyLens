package lk.ac.sliit.legacylens.learning.ai.source;

import java.util.List;

public interface SourceContentProvider {

	List<SourceContentSummary> search(SourceSearchCriteria criteria);

	List<SourceContent> findApprovedByIds(List<String> contentIds);
}
