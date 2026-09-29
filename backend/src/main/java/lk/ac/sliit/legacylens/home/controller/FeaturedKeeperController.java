package lk.ac.sliit.legacylens.home.controller;

import lk.ac.sliit.legacylens.common.dto.ApiResponse;
import lk.ac.sliit.legacylens.home.dto.FeaturedKeeperResponse;
import lk.ac.sliit.legacylens.home.entity.FeaturedKeeper;
import lk.ac.sliit.legacylens.home.repository.FeaturedKeeperRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/home/featured-keeper")
public class FeaturedKeeperController {

    private final FeaturedKeeperRepository repository;

    public FeaturedKeeperController(FeaturedKeeperRepository repository) {
        this.repository = repository;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<FeaturedKeeperResponse>> getFeaturedKeeper() {
        List<FeaturedKeeper> keepers = repository.findAll();
        if (keepers.isEmpty()) {
            return ResponseEntity.ok(ApiResponse.ok(null));
        }
        
        FeaturedKeeper keeper = keepers.get(0);
        FeaturedKeeperResponse res = new FeaturedKeeperResponse();
        res.setId(keeper.getId());
        res.setName(keeper.getName());
        res.setTitle(keeper.getTitle());
        res.setTag(keeper.getTag());
        res.setQuote(keeper.getQuote());
        res.setAvatarUrl(keeper.getAvatarUrl());
        res.setLikesCount(keeper.getLikesCount());
        
        return ResponseEntity.ok(ApiResponse.ok(res));
    }
}
