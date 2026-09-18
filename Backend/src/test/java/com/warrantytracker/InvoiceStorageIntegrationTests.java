package com.warrantytracker;

import io.zonky.test.db.postgres.embedded.EmbeddedPostgres;
import java.awt.image.BufferedImage;
import java.io.*;
import java.sql.*;
import java.time.Instant;
import java.util.*;
import javax.imageio.ImageIO;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.context.*;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.web.servlet.*;
import org.springframework.test.web.servlet.request.MockMultipartHttpServletRequestBuilder;
import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.transaction.PlatformTransactionManager;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;
import static org.assertj.core.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest(properties={
    "spring.flyway.enabled=true", "spring.flyway.default-schema=warranty_migrations",
    "spring.flyway.schemas=warranty_migrations",
    "spring.flyway.locations=classpath:db/migration,classpath:db/supabase",
    "spring.jpa.hibernate.ddl-auto=validate",
    "spring.jpa.properties.hibernate.default_schema=public",
    "app.storage.enabled=true", "app.storage.service-key=test-service-key",
    "app.storage.signed-url-seconds=300", "app.storage.cleanup-enabled=false"
})
@AutoConfigureMockMvc
@DirtiesContext
class InvoiceStorageIntegrationTests {
    static final EmbeddedPostgres pg;
    static final FakeSupabase storage;
    static {
        try {
            pg = EmbeddedPostgres.builder().setPort(0).start();
            storage = new FakeSupabase();
            // Only the bucket catalog/roles are simulated; application DDL runs on real PostgreSQL.
            try (Connection connection = pg.getPostgresDatabase().getConnection(); Statement sql = connection.createStatement()) {
                sql.execute("CREATE ROLE anon");
                sql.execute("CREATE ROLE authenticated");
                sql.execute("CREATE SCHEMA storage");
                sql.execute("CREATE TABLE storage.buckets (id text primary key, name text, public boolean, file_size_limit bigint, allowed_mime_types text[])");
            }
        } catch (Exception ex) { throw new ExceptionInInitializerError(ex); }
    }
    @DynamicPropertySource static void properties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", () -> pg.getJdbcUrl("postgres", "postgres"));
        registry.add("spring.datasource.username", () -> "postgres");
        registry.add("spring.datasource.password", () -> "postgres");
        registry.add("app.storage.url", storage::url);
    }
    @AfterAll static void stop() throws Exception { storage.close(); pg.close(); }

    @Autowired MockMvc mvc;
    @Autowired ObjectMapper json;
    @Autowired JdbcTemplate jdbc;
    @Autowired AttachmentRepository attachments;
    @Autowired WarrantyRepository warranties;
    @Autowired CleanupRepository tasks;
    @Autowired StorageCleanupService cleanup;
    @Autowired WarrantyService service;
    @Autowired PlatformTransactionManager transactionManager;

    @BeforeEach void reset() {
        jdbc.execute("TRUNCATE public.app_user, public.storage_cleanup_task CASCADE");
        storage.reset();
    }
    static byte[] png() throws IOException {
        ByteArrayOutputStream output = new ByteArrayOutputStream();
        ImageIO.write(new BufferedImage(4, 3, BufferedImage.TYPE_INT_RGB), "png", output);
        return output.toByteArray();
    }
    private JsonNode body(MvcResult result) throws Exception {
        return json.readTree(result.getResponse().getContentAsString());
    }
    private JsonNode signup(String email) throws Exception {
        return body(mvc.perform(post("/api/auth/signup").contentType(MediaType.APPLICATION_JSON)
            .content(json.writeValueAsString(Map.of("name", "Owner", "email", email, "password", "secret123"))))
            .andExpect(status().isCreated()).andReturn());
    }
    private MockMultipartHttpServletRequestBuilder form(HttpMethod method, String path, String token) {
        return (MockMultipartHttpServletRequestBuilder) multipart(method, path)
            .header("Authorization", "Bearer " + token).param("productName", "Camera")
            .param("purchaseDate", "2026-01-01").param("expiryDate", "2027-01-01").param("version", "0");
    }
    private JsonNode create(String token) throws Exception {
        return body(mvc.perform(form(HttpMethod.POST, "/api/warranties", token)
            .file(new MockMultipartFile("invoiceImage", "../receipt.png", "image/png", png())))
            .andExpect(status().isCreated()).andExpect(jsonPath("$.fileName").value("receipt.png"))
            .andExpect(jsonPath("$.storageKey").doesNotExist()).andReturn());
    }
    private void cleanupAll() {
        jdbc.update("UPDATE public.storage_cleanup_task SET next_attempt_at = ?", java.sql.Timestamp.from(Instant.now().minusSeconds(1)));
        for (StorageCleanupTask task : tasks.findAll()) cleanup.process(task.id);
    }

    @Test void migrationsConfigurePrivateBucketAndDenyBrowserTableAccess() {
        assertThat(jdbc.queryForObject("SELECT count(*) FROM warranty_migrations.flyway_schema_history WHERE success AND version IS NOT NULL", Integer.class)).isEqualTo(3);
        assertThat(jdbc.queryForObject("SELECT public FROM storage.buckets WHERE id='invoices'", Boolean.class)).isFalse();
        assertThat(jdbc.queryForObject("SELECT file_size_limit FROM storage.buckets WHERE id='invoices'", Long.class)).isEqualTo(10L * 1024 * 1024);
        assertThat(jdbc.queryForObject("SELECT relrowsecurity FROM pg_class WHERE oid='public.warranty_attachment'::regclass", Boolean.class)).isTrue();
        assertThat(jdbc.queryForObject("SELECT has_table_privilege('anon', 'public.warranty_attachment', 'SELECT')", Boolean.class)).isFalse();
        assertThat(jdbc.queryForObject("SELECT has_table_privilege('authenticated', 'public.app_user', 'SELECT')", Boolean.class)).isFalse();
    }
    @Test void uploadReadListAndCrossUserAccessRespectOwnership() throws Exception {
        JsonNode owner = signup("owner@example.com");
        String token = owner.get("token").asText();
        JsonNode created = create(token);
        String id = created.get("id").asText();
        WarrantyAttachment attachment = attachments.findAll().getFirst();
        assertThat(attachment.storageKey).startsWith(owner.get("user").get("id").asText() + "/" + id + "/");
        assertThat(attachment.contentType).isEqualTo("image/png");
        assertThat(attachment.sizeBytes).isEqualTo(storage.objects.get(attachment.storageKey).length);
        mvc.perform(get("/api/warranties/" + id).header("Authorization", "Bearer " + token))
            .andExpect(status().isOk()).andExpect(jsonPath("$.invoiceImageUrl").value(org.hamcrest.Matchers.startsWith(storage.url() + "/storage/v1/object/sign/invoices/")))
            .andExpect(jsonPath("$.storageKey").doesNotExist()).andExpect(jsonPath("$.owner").doesNotExist());
        mvc.perform(get("/api/warranties").header("Authorization", "Bearer " + token))
            .andExpect(status().isOk()).andExpect(jsonPath("$[0].invoiceImageUrl").isString());
        assertThat(storage.lastExpiry).isEqualTo(300);
        int signed = storage.signatures.get();
        String stranger = signup("stranger@example.com").get("token").asText();
        mvc.perform(get("/api/warranties/" + id).header("Authorization", "Bearer " + stranger)).andExpect(status().isNotFound());
        mvc.perform(form(HttpMethod.PUT, "/api/warranties/" + id, stranger)
            .file(new MockMultipartFile("invoiceImage", "attack.png", "image/png", png())))
            .andExpect(status().isNotFound());
        mvc.perform(delete("/api/warranties/" + id).header("Authorization", "Bearer " + stranger))
            .andExpect(status().isNotFound());
        mvc.perform(get("/api/warranties").header("Authorization", "Bearer " + stranger))
            .andExpect(status().isOk()).andExpect(content().json("[]"));
        assertThat(storage.signatures.get()).isEqualTo(signed);
        assertThat(storage.objects).hasSize(1);
        cleanupAll(); // The upload journal must never delete a committed receipt.
        assertThat(storage.objects).hasSize(1);
        assertThat(tasks.count()).isZero();
    }
    @Test void replacingReceiptAdvancesVersionAndCleanupRetriesAfterFailure() throws Exception {
        String token = signup("owner@example.com").get("token").asText();
        String id = create(token).get("id").asText();
        String oldKey = attachments.findAll().getFirst().storageKey;
        mvc.perform(form(HttpMethod.PUT, "/api/warranties/" + id, token)
            .file(new MockMultipartFile("invoiceImage", "replacement.png", "image/png", png())))
            .andExpect(status().isOk()).andExpect(jsonPath("$.version").value(1));
        String newKey = attachments.findAll().getFirst().storageKey;
        assertThat(newKey).isNotEqualTo(oldKey);
        assertThat(storage.objects).hasSize(2);
        storage.failDeletes = true;
        cleanupAll();
        assertThat(storage.objects).containsKeys(oldKey, newKey);
        assertThat(tasks.findAll()).anyMatch(t -> t.attempts > 0);
        storage.failDeletes = false;
        cleanupAll();
        assertThat(storage.objects).containsOnlyKeys(newKey);
        mvc.perform(delete("/api/warranties/" + id).header("Authorization", "Bearer " + token))
            .andExpect(status().isNoContent());
        assertThat(attachments.count()).isZero();
        cleanupAll();
        assertThat(storage.objects).isEmpty();
        assertThat(tasks.count()).isZero();
    }
    @Test void editWithoutNewFilePreservesReceiptAndStaleEditNeverUploads() throws Exception {
        String token = signup("owner@example.com").get("token").asText();
        String id = create(token).get("id").asText();
        String key = attachments.findAll().getFirst().storageKey;
        mvc.perform(form(HttpMethod.PUT, "/api/warranties/" + id, token).param("notes", "Changed"))
            .andExpect(status().isOk()).andExpect(jsonPath("$.fileName").value("receipt.png"));
        mvc.perform(form(HttpMethod.PUT, "/api/warranties/" + id, token)
            .file(new MockMultipartFile("invoiceImage", "stale.png", "image/png", png())))
            .andExpect(status().isConflict());
        assertThat(storage.objects).containsOnlyKeys(key);
        assertThat(attachments.findAll().getFirst().storageKey).isEqualTo(key);
    }
    @Test void uncertainUploadFailureRollsBackDatabaseAndLeavesDurableCleanup() throws Exception {
        String token = signup("owner@example.com").get("token").asText();
        storage.failUploads = true;
        mvc.perform(form(HttpMethod.POST, "/api/warranties", token)
            .file(new MockMultipartFile("invoiceImage", "receipt.png", "image/png", png())))
            .andExpect(status().isServiceUnavailable())
            .andExpect(jsonPath("$.message").value("Invoice storage is temporarily unavailable. Please try again."));
        assertThat(warranties.count()).isZero();
        assertThat(attachments.count()).isZero();
        assertThat(tasks.count()).isEqualTo(1);
        assertThat(storage.objects).hasSize(1);
        cleanupAll();
        assertThat(storage.objects).isEmpty();
    }
    @Test void databaseRollbackAfterUploadKeepsOriginalAndCleansOnlyNewFile() throws Exception {
        JsonNode owner = signup("owner@example.com");
        String token = owner.get("token").asText();
        UUID ownerId = UUID.fromString(owner.get("user").get("id").asText());
        UUID id = UUID.fromString(create(token).get("id").asText());
        String original = attachments.findAll().getFirst().storageKey;
        WarrantyRequest request = new WarrantyRequest();
        request.productName = "Camera";
        request.purchaseDate = java.time.LocalDate.of(2026, 1, 1);
        request.expiryDate = java.time.LocalDate.of(2027, 1, 1);
        request.version = 0L;
        request.invoiceImage = new MockMultipartFile("invoiceImage", "new.png", "image/png", png());
        TransactionTemplate transaction = new TransactionTemplate(transactionManager);
        assertThatThrownBy(() -> transaction.executeWithoutResult(status -> {
            service.update(id, ownerId, request);
            throw new IllegalStateException("simulate commit failure");
        })).isInstanceOf(IllegalStateException.class);
        assertThat(attachments.findAll().getFirst().storageKey).isEqualTo(original);
        assertThat(storage.objects).hasSize(2);
        cleanupAll();
        assertThat(storage.objects).containsOnlyKeys(original);
        assertThat(warranties.findById(id).orElseThrow().version).isZero();
    }
    @Test void invalidFilesNeverReachStorage() throws Exception {
        String token = signup("owner@example.com").get("token").asText();
        for (MockMultipartFile file : List.of(
            new MockMultipartFile("invoiceImage", "fake.png", "image/png", "<script>x</script>".getBytes()),
            new MockMultipartFile("invoiceImage", "wrong.jpg", "image/jpeg", png()),
            new MockMultipartFile("invoiceImage", "receipt.svg", "image/svg+xml", png()),
            new MockMultipartFile("invoiceImage", "empty.png", "image/png", new byte[0])
        )) {
            mvc.perform(form(HttpMethod.POST, "/api/warranties", token).file(file)).andExpect(status().isBadRequest());
        }
        mvc.perform(form(HttpMethod.POST, "/api/warranties", token).file(
            new MockMultipartFile("invoiceImage", "large.png", "image/png", new byte[InvoiceValidator.MAX_BYTES + 1])))
            .andExpect(status().isPayloadTooLarge());
        assertThat(warranties.count()).isZero();
        assertThat(tasks.count()).isZero();
        assertThat(storage.objects).isEmpty();
    }
    @Test void signingFailureDoesNotRemoveSavedDataOrLeakServiceCredentials() throws Exception {
        String token = signup("owner@example.com").get("token").asText();
        String id = create(token).get("id").asText();
        storage.failSigning = true;
        MvcResult result = mvc.perform(get("/api/warranties/" + id).header("Authorization", "Bearer " + token))
            .andExpect(status().isServiceUnavailable()).andReturn();
        assertThat(result.getResponse().getContentAsString()).doesNotContain("test-service-key", "storageKey", "token=");
        assertThat(attachments.count()).isEqualTo(1);
        assertThat(storage.objects).hasSize(1);
    }
}
