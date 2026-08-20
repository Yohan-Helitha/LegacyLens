package lk.ac.sliit.legacylens.auth.security;

import lk.ac.sliit.legacylens.users.entity.AccountStatus;
import lk.ac.sliit.legacylens.users.entity.RoleStatus;
import lk.ac.sliit.legacylens.users.entity.User;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Adapts our User entity to what Spring Security expects.
 * Wraps rather than extends User, so the users module stays framework-agnostic.
 *
 * Authorities are resolved once, here in the constructor, instead of lazily
 * inside getAuthorities(). CustomUserDetails is built inside
 * CustomUserDetailsService.loadUserByUsername() while a Hibernate session is
 * still guaranteed open (see @Transactional there), but getAuthorities() can
 * be called much later in the request — e.g. by @PreAuthorize checks deep in
 * a controller — long after that session has closed. Reading user.getRoles()
 * at that point would throw LazyInitializationException. Caching the result
 * as a plain list here means this class never touches the JPA proxy again
 * after construction, regardless of session state.
 */
public class CustomUserDetails implements UserDetails {

    private final User user;
    private final List<GrantedAuthority> authorities;

    public CustomUserDetails(User user) {
        this.user = user;
        this.authorities = user.getRoles().stream()
                .filter(role -> role.getStatus() == RoleStatus.ACTIVE)
                .map(role -> (GrantedAuthority) new SimpleGrantedAuthority("ROLE_" + role.getRoleType().name()))
                .collect(Collectors.toUnmodifiableList());
    }

    public User getUser() {
        return user;
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return authorities;
    }

    @Override
    public String getPassword() {
        return user.getPinHash();
    }

    @Override
    public String getUsername() {
        return user.getPhoneNumber();
    }

    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        return user.getAccountStatus() != AccountStatus.SUSPENDED;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    public boolean isEnabled() {
        return user.getAccountStatus() == AccountStatus.ACTIVE;
    }
}
