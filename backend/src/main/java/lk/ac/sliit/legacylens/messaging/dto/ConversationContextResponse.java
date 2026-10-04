package lk.ac.sliit.legacylens.messaging.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDate;
import java.util.UUID;

/**
 * What the two people are working on together — the context card at the top
 * of the chat. Date/time come from the creator's actual booking (Job) when
 * one exists, otherwise from the opportunity's own schedule.
 */
@Data
@Builder
@AllArgsConstructor
public class ConversationContextResponse {

    private UUID opportunityId;
    private String title;
    /** A short line under the title — the opportunity's category, if any. */
    private String subtitle;
    private LocalDate date;
    private String timeWindowText;
    private String location;
    /** True once the creator has booked this opportunity (a Job exists). */
    private boolean booked;
}
