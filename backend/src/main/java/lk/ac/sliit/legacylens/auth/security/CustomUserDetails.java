package lk.ac.sliit.legacylens.auth.security;

import lk.ac.sliit.legacylens.users.entity.AccountStatus;
import lk.ac.sliit.legacylens.users.entity.RoleStatus;
import lk.ac.sliit.legacylens.users.entity.User;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.stream.Collectors;

/**
 * Adapts our User entity to what Spring Security expects.
 * Wraps rather than extends User, so the users module stays framework-agnostic.
 */
public class CustomUserDetails implements UserDetails {

    private final User user;

    public CustomUserDetails(User user) {
        this.user = user;
    }

    public User getUser() {
        return user;
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return user.getRoles().stream()
                .filter(role -> role.getStatus() == RoleStatus.ACTIVE)
                .map(role -> new SimpleGrantedAuthority("ROLE_" + role.getRoleType().name()))
                .collect(Collectors.toList());
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
