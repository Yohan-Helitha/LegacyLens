package lk.ac.sliit.legacylens.home.controller;

import lk.ac.sliit.legacylens.common.dto.ApiResponse;
import lk.ac.sliit.legacylens.home.dto.FeaturedKeeperResponse;
import lk.ac.sliit.legacylens.home.service.KnowledgeKeeperService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/home/featured-keeper")
@RequiredArgsConstructor
public class FeaturedKeeperController {

    private final KnowledgeKeeperService knowledgeKeeperService;

    @GetMapping
    public ResponseEntity<ApiResponse<FeaturedKeeperResponse>> getFeaturedKeeper() {
        FeaturedKeeperResponse res = knowledgeKeeperService.getFeaturedKeeperOfToday();
        return ResponseEntity.ok(ApiResponse.ok(res));
    }
}
