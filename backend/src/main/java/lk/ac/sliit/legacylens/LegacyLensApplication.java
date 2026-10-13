package lk.ac.sliit.legacylens;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@EnableScheduling
@SpringBootApplication
public class LegacyLensApplication {

    public static void main(String[] args) {
        SpringApplication.run(LegacyLensApplication.class, args);
    }
}
