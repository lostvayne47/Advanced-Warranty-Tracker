package com.warrantytracker;

import com.sun.net.httpserver.HttpServer;
import java.net.*;
import java.nio.charset.StandardCharsets;
import java.util.*;
import org.junit.jupiter.api.Test;
import org.springframework.web.server.ResponseStatusException;
import tools.jackson.databind.ObjectMapper;
import static org.assertj.core.api.Assertions.*;

class GeminiInvoiceExtractorTests {
    final ObjectMapper json = new ObjectMapper();
    String response(Map<String, Object> fields) {
        return json.writeValueAsString(Map.of("candidates", List.of(Map.of("finishReason", "STOP",
            "content", Map.of("parts", List.of(Map.of("text", json.writeValueAsString(
                Map.of("fields", fields, "warnings", List.of("Review expiry manually."))))))))));
    }
    @Test void filtersUnknownFieldsAndInvalidDatesAmountsAndLinks() {
        var extractor = new GeminiInvoiceExtractor("test", URI.create("http://localhost"), json);
        var result = extractor.parse(response(Map.of("productName", "Camera", "purchaseDate", "2026-02-30",
            "purchasePrice", "-500", "supportUrl", "javascript:alert(1)", "userId", "attacker", "currency", "INR")));
        assertThat(result.fields()).containsExactlyInAnyOrderEntriesOf(Map.of("productName", "Camera", "currency", "INR"));
        assertThat(result.warnings()).hasSize(4);
    }
    @Test void rejectsIncompleteOrBlockedOutputAndMissingConfiguration() {
        var extractor = new GeminiInvoiceExtractor("", URI.create("http://localhost"), json);
        assertThatThrownBy(extractor::checkConfigured).isInstanceOf(ResponseStatusException.class).hasMessageContaining("GEMINI_API_KEY");
        for (String body : List.of("not json", "{}", "{\"candidates\":[{\"finishReason\":\"MAX_TOKENS\"}]}"))
            assertThatThrownBy(() -> extractor.parse(body)).isInstanceOf(ResponseStatusException.class).hasMessageContaining("incomplete");
    }
    @Test void sendsImageAndSchemaAndDoesNotExposeProviderErrors() throws Exception {
        HttpServer server = HttpServer.create(new InetSocketAddress("127.0.0.1", 0), 0);
        List<String> requests = new ArrayList<>();
        server.createContext("/", exchange -> {
            requests.add(new String(exchange.getRequestBody().readAllBytes(), StandardCharsets.UTF_8));
            assertThat(exchange.getRequestHeaders().getFirst("x-goog-api-key")).isEqualTo("test-key");
            byte[] body = (requests.size() == 1 ? response(Map.of("productName", "Camera", "purchasePrice", "1200.00")) : "secret-provider-error").getBytes(StandardCharsets.UTF_8);
            exchange.sendResponseHeaders(requests.size() == 1 ? 200 : 429, body.length);
            exchange.getResponseBody().write(body);
            exchange.close();
        });
        server.start();
        try {
            var extractor = new GeminiInvoiceExtractor("test-key", URI.create("http://127.0.0.1:" + server.getAddress().getPort()), json);
            var image = new InvoiceValidator.Image(new byte[]{1, 2, 3}, "image/png", "png", "invoice.png");
            assertThat(extractor.extract(image).fields()).containsEntry("purchasePrice", "1200.00");
            var sent = json.readTree(requests.getFirst());
            assertThat(sent.at("/contents/0/parts/0/inlineData/data").asText()).isEqualTo("AQID");
            assertThat(sent.at("/generationConfig/responseMimeType").asText()).isEqualTo("application/json");
            assertThat(sent.at("/generationConfig/responseJsonSchema/properties/fields/additionalProperties").isBoolean()).isTrue();
            assertThat(sent.at("/generationConfig/responseJsonSchema/properties/fields/additionalProperties").asBoolean()).isFalse();
            assertThatThrownBy(() -> extractor.extract(image)).isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("quota").hasMessageNotContaining("secret-provider-error");
        } finally { server.stop(0); }
    }
}
