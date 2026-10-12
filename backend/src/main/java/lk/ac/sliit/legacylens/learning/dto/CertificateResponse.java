package lk.ac.sliit.legacylens.learning.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class CertificateResponse {

    private Long trackId;
    private String trackTitle;
    private String learnerName;
    private String completionDate;
}