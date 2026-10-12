package lk.ac.sliit.legacylens.admin.controller;

import jakarta.validation.Valid;
import lk.ac.sliit.legacylens.admin.dto.AdminWordOfTheDayResponse;
import lk.ac.sliit.legacylens.admin.service.AdminWordOfTheDayService;
import lk.ac.sliit.legacylens.common.dto.ApiResponse;
import lk.ac.sliit.legacylens.home.dto.WordOfTheDayRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/word-of-the-day")
@RequiredArgsConstructor
public class AdminWordOfTheDayController {

    private final AdminWordOfTheDayService service;

    /**
     * GET /api/admin/word-of-the-day - list all entries ordered by activeDate DESC
     */
    @GetMapping
    public ResponseEntity<ApiResponse<List<AdminWordOfTheDayResponse>>> getAllWords() {
        return ResponseEntity.ok(ApiResponse.ok("Words retrieved successfully", service.getAllWords()));
    }

    /** POST /api/admin/word-of-the-day - create a new entry */
    @PostMapping
    public ResponseEntity<ApiResponse<AdminWordOfTheDayResponse>> createWord(
            @Valid @RequestBody WordOfTheDayRequest request,
            @RequestHeader(value = "X-Admin-Id", defaultValue = "unknown") String adminId,
            @RequestHeader(value = "X-Admin-Name", defaultValue = "Admin") String adminName) {
        return ResponseEntity.ok(ApiResponse.ok("Word created successfully",
                service.createWord(request, adminId, adminName)));
    }

    /** PUT /api/admin/word-of-the-day/{id} - update an existing entry */
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<AdminWordOfTheDayResponse>> updateWord(
            @PathVariable Long id,
            @Valid @RequestBody WordOfTheDayRequest request,
            @RequestHeader(value = "X-Admin-Id", defaultValue = "unknown") String adminId,
            @RequestHeader(value = "X-Admin-Name", defaultValue = "Admin") String adminName) {
        return ResponseEntity.ok(ApiResponse.ok("Word updated successfully",
                service.updateWord(id, request, adminId, adminName)));
    }

    /** DELETE /api/admin/word-of-the-day/{id} - remove an entry */
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteWord(
            @PathVariable Long id,
            @RequestHeader(value = "X-Admin-Id", defaultValue = "unknown") String adminId,
            @RequestHeader(value = "X-Admin-Name", defaultValue = "Admin") String adminName) {
        service.deleteWord(id, adminId, adminName);
        return ResponseEntity.ok(ApiResponse.ok("Word deleted successfully", null));
    }
}
