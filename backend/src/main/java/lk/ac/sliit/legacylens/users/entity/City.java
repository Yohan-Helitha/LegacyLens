package lk.ac.sliit.legacylens.users.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Represents a Sri Lankan city stored in the `cities` table.
 * Used as a lookup / FK reference from the `users` table.
 */
@Entity
@Table(name = "cities")
@Getter
@Setter
@NoArgsConstructor
public class City {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    /** Display name of the city (e.g. "Colombo"). */
    @Column(nullable = false, length = 100)
    private String name;

    /** Province / region the city belongs to (nullable). */
    @Column(length = 100)
    private String region;

    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getRegion() {
        return region;
    }

    public void setRegion(String region) {
        this.region = region;
    }
}
