package com.warrantytracker;

import java.time.Instant;
import java.util.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.*;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.*;
import org.springframework.test.web.servlet.*;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

import static org.assertj.core.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
class ApiIntegrationTests {
    @Autowired MockMvc mvc;
    @Autowired ObjectMapper json;
    @Autowired UserRepository users;
    @Autowired WarrantyRepository warranties;
    @Autowired PasswordEncoder passwords;
    @Autowired JwtEncoder encoder;

    @BeforeEach void clearDatabase() {
        warranties.deleteAll();
        users.deleteAll();
    }
    private JsonNode body(MvcResult result) throws Exception {
        return json.readTree(result.getResponse().getContentAsString());
    }
    private JsonNode signup(String email) throws Exception {
        return body(mvc.perform(post("/api/auth/signup").contentType(MediaType.APPLICATION_JSON)
            .content(json.writeValueAsString(Map.of("name", "Test User", "email", email, "password", "secret123"))))
            .andExpect(status().isCreated()).andExpect(jsonPath("$.user.passwordHash").doesNotExist()).andReturn());
    }
    private String token(String email) throws Exception { return signup(email).get("token").asText(); }
    private String data(String name, Long version) throws Exception {
        Map<String, Object> values = new LinkedHashMap<>();
        values.put("productName", name);
        values.put("purchaseDate", "2026-01-01");
        values.put("expiryDate", "2027-01-01");
        if (version != null) values.put("version", version);
        return json.writeValueAsString(values);
    }
    private JsonNode create(String token) throws Exception {
        return body(mvc.perform(post("/api/warranties").header("Authorization", "Bearer " + token)
            .contentType(MediaType.APPLICATION_JSON).content(data("Laptop", null)))
            .andExpect(status().isCreated()).andExpect(jsonPath("$.owner").doesNotExist()).andReturn());
    }
    @Test void signupHashesPasswordAndLoginReturnsRealJwt() throws Exception {
        JsonNode session = signup("USER@example.com");
        AppUser user = users.findByEmail("user@example.com").orElseThrow();
        assertThat(user.passwordHash).isNotEqualTo("secret123");
        assertThat(passwords.matches("secret123", user.passwordHash)).isTrue();
        assertThat(session.get("token").asText().split("\\.")).hasSize(3);
        mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
            .content("{\"email\":\"USER@example.com\",\"password\":\"secret123\"}"))
            .andExpect(status().isOk()).andExpect(jsonPath("$.user.email").value("user@example.com"))
            .andExpect(jsonPath("$.token").isString());
        mvc.perform(post("/api/auth/signup").contentType(MediaType.APPLICATION_JSON)
            .content("{\"name\":\"Duplicate\",\"email\":\"user@example.com\",\"password\":\"secret123\"}"))
            .andExpect(status().isConflict());
    }
    @Test void invalidCredentialsAndInvalidSignupFail() throws Exception {
        signup("user@example.com");
        for (String email : List.of("user@example.com", "missing@example.com")) {
            mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
                .content(json.writeValueAsString(Map.of("email", email, "password", "incorrect"))))
                .andExpect(status().isUnauthorized()).andExpect(jsonPath("$.message").value("Invalid email or password."));
        }
        mvc.perform(post("/api/auth/signup").contentType(MediaType.APPLICATION_JSON)
            .content("{\"name\":\"\",\"email\":\"invalid\",\"password\":\"123\"}"))
            .andExpect(status().isBadRequest()).andExpect(jsonPath("$.errors.email").exists());
    }
    @Test void unauthenticatedAndInvalidTokensAreRejected() throws Exception {
        mvc.perform(get("/api/warranties")).andExpect(status().isUnauthorized());
        mvc.perform(get("/api/warranties").header("Authorization", "Bearer demo-jwt-token"))
            .andExpect(status().isUnauthorized()).andExpect(jsonPath("$.message").exists());
        String valid = token("user@example.com");
        String[] parts = valid.split("\\.");
        String tampered = parts[0] + "." + parts[1] + "." + (parts[2].startsWith("A") ? "B" : "A") + parts[2].substring(1);
        mvc.perform(get("/api/warranties").header("Authorization", "Bearer " + tampered))
            .andExpect(status().isUnauthorized());
    }
    @Test void expiredAndWrongIssuerTokensAreRejected() throws Exception {
        for (String issuer : List.of("warranty-tracker", "wrong-issuer")) {
            Instant now = Instant.now();
            JwtClaimsSet claims = JwtClaimsSet.builder().issuer(issuer).subject(UUID.randomUUID().toString())
                .issuedAt(now.minusSeconds(7200))
                .expiresAt(issuer.equals("warranty-tracker") ? now.minusSeconds(3600) : now.plusSeconds(3600)).build();
            String jwt = encoder.encode(JwtEncoderParameters.from(JwsHeader.with(MacAlgorithm.HS256).build(), claims)).getTokenValue();
            mvc.perform(get("/api/warranties").header("Authorization", "Bearer " + jwt))
                .andExpect(status().isUnauthorized());
        }
    }
    @Test void ownerCanCreateListReadUpdateAndDelete() throws Exception {
        String token = token("owner@example.com");
        JsonNode created = create(token);
        String id = created.get("id").asText();
        mvc.perform(get("/api/warranties").header("Authorization", "Bearer " + token))
            .andExpect(status().isOk()).andExpect(jsonPath("$.length()").value(1));
        mvc.perform(get("/api/warranties/" + id).header("Authorization", "Bearer " + token))
            .andExpect(status().isOk()).andExpect(jsonPath("$.productName").value("Laptop"));
        mvc.perform(put("/api/warranties/" + id).header("Authorization", "Bearer " + token)
            .contentType(MediaType.APPLICATION_JSON).content(data("Updated laptop", created.get("version").asLong())))
            .andExpect(status().isOk()).andExpect(jsonPath("$.productName").value("Updated laptop"))
            .andExpect(jsonPath("$.version").value(1));
        mvc.perform(delete("/api/warranties/" + id).header("Authorization", "Bearer " + token))
            .andExpect(status().isNoContent());
        mvc.perform(get("/api/warranties/" + id).header("Authorization", "Bearer " + token))
            .andExpect(status().isNotFound());
    }
    @Test void anotherUserCannotListReadEditOrDeleteOwnersWarranty() throws Exception {
        String owner = token("owner@example.com");
        String id = create(owner).get("id").asText();
        String stranger = token("stranger@example.com");
        mvc.perform(get("/api/warranties").header("Authorization", "Bearer " + stranger))
            .andExpect(status().isOk()).andExpect(content().json("[]"));
        mvc.perform(get("/api/warranties/" + id).header("Authorization", "Bearer " + stranger))
            .andExpect(status().isNotFound());
        mvc.perform(put("/api/warranties/" + id).header("Authorization", "Bearer " + stranger)
            .contentType(MediaType.APPLICATION_JSON).content(data("Stolen", 0L)))
            .andExpect(status().isNotFound());
        mvc.perform(delete("/api/warranties/" + id).header("Authorization", "Bearer " + stranger))
            .andExpect(status().isNotFound());
        assertThat(warranties.findById(UUID.fromString(id)).orElseThrow().productName).isEqualTo("Laptop");
    }
    @Test void staleAndMissingUpdateVersionsAreRejected() throws Exception {
        String token = token("owner@example.com");
        String path = "/api/warranties/" + create(token).get("id").asText();
        mvc.perform(put(path).header("Authorization", "Bearer " + token)
            .contentType(MediaType.APPLICATION_JSON).content(data("Missing", null)))
            .andExpect(status().isBadRequest());
        mvc.perform(put(path).header("Authorization", "Bearer " + token)
            .contentType(MediaType.APPLICATION_JSON).content(data("Updated", 0L))).andExpect(status().isOk());
        mvc.perform(put(path).header("Authorization", "Bearer " + token)
            .contentType(MediaType.APPLICATION_JSON).content(data("Stale", 0L))).andExpect(status().isConflict());
    }
    @Test void frontendMultipartContractAndProtectedFieldsWork() throws Exception {
        String token = token("owner@example.com");
        JsonNode created = body(mvc.perform(multipart("/api/warranties")
            .header("Authorization", "Bearer " + token)
            .param("productName", "  Camera  ").param("purchaseDate", "2026-01-01").param("expiryDate", "2027-01-01")
            .param("purchasePrice", "").param("coverageStartDate", "").param("supportUrl", "")
            .param("userId", UUID.randomUUID().toString()).param("id", UUID.randomUUID().toString())
            .param("createdAt", "2000-01-01T00:00:00Z").param("version", "999"))
            .andExpect(status().isCreated()).andExpect(jsonPath("$.version").value(0))
            .andExpect(jsonPath("$.productName").value("Camera")).andReturn());
        String path = "/api/warranties/" + created.get("id").asText();
        mvc.perform(multipart(HttpMethod.PUT, path).header("Authorization", "Bearer " + token)
            .param("productName", "Updated Camera").param("purchaseDate", "2026-01-01")
            .param("expiryDate", "2027-01-01").param("version", "0"))
            .andExpect(status().isOk()).andExpect(jsonPath("$.productName").value("Updated Camera"));
        mvc.perform(get(path).header("Authorization", "Bearer " + token)).andExpect(status().isOk());
    }
    @Test void invalidWarrantyFieldsAndDatesAreRejected() throws Exception {
        String token = token("owner@example.com");
        for (String content : List.of(
            "{\"productName\":\"Missing dates\"}",
            "{\"productName\":\"Bad dates\",\"purchaseDate\":\"2027-01-01\",\"expiryDate\":\"2026-01-01\"}",
            "{\"productName\":\"Bad price\",\"purchaseDate\":\"2026-01-01\",\"expiryDate\":\"2027-01-01\",\"purchasePrice\":-1}",
            "{\"productName\":\"Bad URL\",\"purchaseDate\":\"2026-01-01\",\"expiryDate\":\"2027-01-01\",\"supportUrl\":\"javascript:alert(1)\"}",
            "{\"productName\":\"Bad coverage\",\"purchaseDate\":\"2026-01-01\",\"expiryDate\":\"2027-01-01\",\"coverageStartDate\":\"2028-01-01\"}"
        )) {
            mvc.perform(post("/api/warranties").header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON).content(content))
                .andExpect(status().isBadRequest()).andExpect(jsonPath("$.message").exists());
        }
        assertThat(warranties.count()).isZero();
    }
    @Test void invoiceIsExplicitlyRejectedUntilStorageExists() throws Exception {
        String token = token("owner@example.com");
        mvc.perform(multipart("/api/warranties").file(new MockMultipartFile("invoiceImage", "receipt.png", "image/png", new byte[]{1,2,3}))
            .header("Authorization", "Bearer " + token)
            .param("productName", "Camera").param("purchaseDate", "2026-01-01").param("expiryDate", "2027-01-01"))
            .andExpect(status().isNotImplemented()).andExpect(jsonPath("$.message").exists());
        assertThat(warranties.count()).isZero();
    }
    @Test void corsAllowsConfiguredFrontendAndRejectsOtherOrigins() throws Exception {
        mvc.perform(options("/api/warranties").header("Origin", "http://localhost:5173")
            .header("Access-Control-Request-Method", "PUT")
            .header("Access-Control-Request-Headers", "authorization,content-type"))
            .andExpect(status().isOk()).andExpect(header().string("Access-Control-Allow-Origin", "http://localhost:5173"));
        mvc.perform(options("/api/warranties").header("Origin", "https://untrusted.example")
            .header("Access-Control-Request-Method", "PUT")).andExpect(status().isForbidden());
    }
}
