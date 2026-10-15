package lk.ac.sliit.legacylens.translation.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.util.List;

@Data
@AllArgsConstructor
public class TranslateResponse {

    /** Same order and size as the request's texts. */
    private List<String> translations;
}
