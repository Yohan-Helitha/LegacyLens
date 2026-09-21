package lk.ac.sliit.legacylens.hiring.dto;

import lombok.Data;

/** reason is intentionally unvalidated — an elder is never required to explain a rejection. */
@Data
public class RejectApplicationRequest {

    private String reason;
}
