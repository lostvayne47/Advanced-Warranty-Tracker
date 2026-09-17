package com.warrantytracker;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Locale;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/auth")
class AuthController {
    private final UserRepository users;
    private final PasswordEncoder passwords;
    private final JwtEncoder jwt;
    private final String issuer;
    private final String dummyHash;

    AuthController(UserRepository users, PasswordEncoder passwords, JwtEncoder jwt,
                   @Value("${app.jwt.issuer}") String issuer) {
        this.users = users; this.passwords = passwords; this.jwt = jwt; this.issuer = issuer;
        this.dummyHash = passwords.encode(UUID.randomUUID().toString());
    }
    record Signup(@NotBlank @Size(max=120) String name,
                  @NotBlank @Email @Size(max=320) String email,
                  @NotBlank @Size(min=6, max=72) String password) {
        @Override public String toString() { return "Signup[credentials redacted]"; }
    }
    record Login(@NotBlank @Email @Size(max=320) String email,
                 @NotBlank @Size(max=72) String password) {
        @Override public String toString() { return "Login[credentials redacted]"; }
    }
    record UserView(UUID id, String name, String email) {}
    record Session(String token, UserView user) {
        @Override public String toString() { return "Session[token redacted]"; }
    }

    @PostMapping("/signup")
    @ResponseStatus(HttpStatus.CREATED)
    Session signup(@Valid @RequestBody Signup request) {
        checkPasswordLength(request.password());
        String email = normalize(request.email());
        if (users.findByEmail(email).isPresent())
            throw new ResponseStatusException(HttpStatus.CONFLICT, "An account with this email already exists.");
        AppUser user = users.saveAndFlush(new AppUser(request.name().trim(), email, passwords.encode(request.password())));
        return session(user);
    }
    @PostMapping("/login")
    Session login(@Valid @RequestBody Login request) {
        checkPasswordLength(request.password());
        AppUser user = users.findByEmail(normalize(request.email())).orElse(null);
        boolean matches = passwords.matches(request.password(),
            user == null || user.passwordHash == null ? dummyHash : user.passwordHash);
        if (user == null || user.passwordHash == null || !matches)
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid email or password.");
        return session(user);
    }
    private Session session(AppUser user) {
        Instant now = Instant.now();
        JwtClaimsSet claims = JwtClaimsSet.builder().issuer(issuer).subject(user.id.toString())
            .issuedAt(now).expiresAt(now.plus(1, ChronoUnit.HOURS)).build();
        String token = jwt.encode(JwtEncoderParameters.from(
            JwsHeader.with(MacAlgorithm.HS256).build(), claims)).getTokenValue();
        return new Session(token, new UserView(user.id, user.name, user.email));
    }
    private static String normalize(String email) { return email.trim().toLowerCase(Locale.ROOT); }
    private static void checkPasswordLength(String password) {
        if (password.getBytes(StandardCharsets.UTF_8).length > 72)
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Password must be at most 72 UTF-8 bytes.");
    }
}
