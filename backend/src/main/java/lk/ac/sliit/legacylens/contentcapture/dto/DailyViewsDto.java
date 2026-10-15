package lk.ac.sliit.legacylens.contentcapture.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.time.LocalDate;

/** Views recorded on one calendar day — one bar of a story's last-7-days chart. */
@Data
@AllArgsConstructor
public class DailyViewsDto {

    private LocalDate date;
    private long views;
}
