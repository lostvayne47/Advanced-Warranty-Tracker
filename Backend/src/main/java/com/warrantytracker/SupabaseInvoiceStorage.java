package com.warrantytracker;

import java.io.IOException;
import java.net.URI;
import java.net.http.*;
import java.time.Duration;
import java.util.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

@Component
class SupabaseInvoiceStorage implements InvoiceStorage, ApplicationRunner {
    private final boolean enabled;
    private final String baseUrl;
    private final String serviceKey;
    private final int expiresIn;
    private final ObjectMapper json;
    private final HttpClient client = HttpClient.newBuilder()
        .connectTimeout(Duration.ofSeconds(5)).followRedirects(HttpClient.Redirect.NEVER).build();

    SupabaseInvoiceStorage(@Value("${app.storage.enabled:false}") boolean enabled,
            @Value("${app.storage.url:}") String url,
            @Value("${app.storage.service-key:}") String serviceKey,
            @Value("${app.storage.signed-url-seconds:300}") int expiresIn, ObjectMapper json) {
        this.enabled = enabled;
        this.baseUrl = url.replaceAll("/+$", "") + "/storage/v1";
        this.serviceKey = serviceKey;
        this.expiresIn = expiresIn;
        this.json = json;
        if (enabled) {
            URI uri = URI.create(url);
            boolean local = Set.of("localhost", "127.0.0.1", "[::1]").contains(Objects.toString(uri.getHost(), ""));
            if (uri.getHost() == null || uri.getUserInfo() != null || uri.getQuery() != null ||
                uri.getFragment() != null || !(uri.getPath().isEmpty() || uri.getPath().equals("/")) ||
                !("https".equals(uri.getScheme()) || (local && "http".equals(uri.getScheme()))) ||
                serviceKey.isBlank() || expiresIn < 30 || expiresIn > 900)
                throw new IllegalArgumentException("Configure a valid HTTPS SUPABASE_URL, server-only service key and 30-900 second URL lifetime.");
        }
    }

    @Override public void run(ApplicationArguments args) {
        if (!enabled) return;
        // Fail startup if setup accidentally points at a public bucket.
        JsonNode bucket = read(send("GET", "/bucket/invoices", null, null).body());
        if (bucket.path("public").asBoolean(true) || !bucket.path("id").asText().equals("invoices"))
            throw new IllegalStateException("The Supabase invoices bucket must exist and be private.");
    }

    @Override public void upload(String key, byte[] bytes, String contentType) {
        checkKey(key);
        send("POST", "/object/invoices/" + key, bytes, contentType);
    }

    @Override public String signedUrl(String key) {
        checkKey(key);
        JsonNode data = read(send("POST", "/object/sign/invoices/" + key,
            json.writeValueAsBytes(Map.of("expiresIn", expiresIn)), "application/json").body());
        String path = data.path("signedURL").asText("");
        // The Storage API returns a relative path; do not trust arbitrary hosts.
        String expected = "/object/sign/invoices/" + key + "?";
        if (!path.startsWith(expected) || URI.create(path).getRawQuery() == null)
            throw new StorageUnavailableException();
        return baseUrl + path;
    }

    @Override public void delete(String key) {
        checkKey(key);
        // Batch removal is idempotent when the object is already absent.
        send("DELETE", "/object/invoices",
            json.writeValueAsBytes(Map.of("prefixes", List.of(key))), "application/json");
    }

    private HttpResponse<String> send(String method, String path, byte[] body, String contentType) {
        if (!enabled) throw new StorageUnavailableException(
            "Invoice storage is not configured. Remove the selected image to save the warranty details without an attachment, or configure Supabase storage.");
        HttpRequest.Builder request = HttpRequest.newBuilder(URI.create(baseUrl + path))
            .timeout(Duration.ofSeconds(30)).header("apikey", serviceKey)
            .header("Authorization", "Bearer " + serviceKey);
        if (contentType != null) request.header("Content-Type", contentType);
        if (method.equals("POST") && path.startsWith("/object/invoices/")) request.header("x-upsert", "false");
        request.method(method, body == null ? HttpRequest.BodyPublishers.noBody() : HttpRequest.BodyPublishers.ofByteArray(body));
        try {
            HttpResponse<String> response = client.send(request.build(), HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() < 200 || response.statusCode() >= 300) throw new StorageUnavailableException();
            return response;
        } catch (InterruptedException ex) {
            Thread.currentThread().interrupt();
            throw new StorageUnavailableException();
        } catch (IOException ex) {
            // Never expose upstream bodies, credentials, object keys or signed URLs.
            throw new StorageUnavailableException();
        }
    }
    private JsonNode read(String body) {
        try { return json.readTree(body); }
        catch (RuntimeException ex) { throw new StorageUnavailableException(); }
    }
    private void checkKey(String key) {
        if (key == null || !key.matches("[0-9a-f-]{36}/[0-9a-f-]{36}/[0-9a-f-]{36}\\.(png|jpg|webp)"))
            throw new IllegalArgumentException("Invalid internal invoice key.");
    }
}
