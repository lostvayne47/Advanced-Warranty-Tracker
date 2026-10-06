package com.warrantytracker;

import com.sun.net.httpserver.*;
import java.io.*;
import java.net.*;
import java.nio.charset.StandardCharsets;
import java.util.*;
import java.util.concurrent.*;
import java.util.concurrent.atomic.*;
import tools.jackson.databind.ObjectMapper;

/** HTTP contract double: requests still pass through the real Supabase client. */
class FakeSupabase implements AutoCloseable {
    final Map<String, byte[]> objects = new ConcurrentHashMap<>();
    final Map<String, String> contentTypes = new ConcurrentHashMap<>();
    final AtomicInteger signatures = new AtomicInteger();
    private record Grant(String key, long expiresAt) {}
    private final Map<String, Grant> grants = new ConcurrentHashMap<>();
    volatile boolean failUploads, failDeletes, failSigning, publicBucket;
    volatile int lastExpiry;
    private final HttpServer server;
    private final ObjectMapper json = new ObjectMapper();

    FakeSupabase() throws IOException {
        server = HttpServer.create(new InetSocketAddress("127.0.0.1", 0), 0);
        server.createContext("/storage/v1/", this::handle);
        server.start();
    }
    String url() { return "http://127.0.0.1:" + server.getAddress().getPort(); }
    void reset() {
        objects.clear(); contentTypes.clear(); signatures.set(0); grants.clear();
        failUploads = failDeletes = failSigning = publicBucket = false;
    }
    private void handle(HttpExchange exchange) throws IOException {
        try {
            String path = exchange.getRequestURI().getPath().substring("/storage/v1".length());
            String method = exchange.getRequestMethod();
            if (method.equals("GET") && path.startsWith("/object/sign/invoices/")) {
                String key = path.substring("/object/sign/invoices/".length());
                String query = Objects.toString(exchange.getRequestURI().getRawQuery(), "");
                Grant grant = grants.get(query.replaceFirst("^token=", ""));
                byte[] bytes = objects.get(key);
                if (grant == null || !grant.key().equals(key) || grant.expiresAt() < System.currentTimeMillis() || bytes == null) {
                    respond(exchange, 403, "{}"); return;
                }
                exchange.getResponseHeaders().set("Content-Type", contentTypes.get(key));
                exchange.sendResponseHeaders(200, bytes.length);
                exchange.getResponseBody().write(bytes);
                return;
            }
            if (!"test-service-key".equals(exchange.getRequestHeaders().getFirst("apikey")) ||
                !"Bearer test-service-key".equals(exchange.getRequestHeaders().getFirst("Authorization"))) {
                respond(exchange, 403, "{\"message\":\"wrong credentials\"}"); return;
            }
            if (path.equals("/bucket/invoices")) {
                respond(exchange, 200, "{\"id\":\"invoices\",\"public\":" + publicBucket + "}"); return;
            }
            if (path.startsWith("/object/sign/invoices/") && method.equals("POST")) {
                if (failSigning) { respond(exchange, 503, "{}"); return; }
                String key = path.substring("/object/sign/invoices/".length());
                lastExpiry = json.readTree(exchange.getRequestBody()).path("expiresIn").asInt();
                if (!objects.containsKey(key)) { respond(exchange, 404, "{}"); return; }
                int signature = signatures.incrementAndGet();
                grants.put("test-" + signature, new Grant(key, System.currentTimeMillis() + lastExpiry * 1000L));
                respond(exchange, 200, json.writeValueAsString(Map.of("signedURL",
                    "/object/sign/invoices/" + key + "?token=test-" + signature))); return;
            }
            if (path.startsWith("/object/invoices/") && method.equals("POST")) {
                String key = path.substring("/object/invoices/".length());
                byte[] bytes = exchange.getRequestBody().readAllBytes();
                // Simulate an uncertain upload outcome: bytes saved, upstream returns failure.
                objects.put(key, bytes);
                contentTypes.put(key, exchange.getRequestHeaders().getFirst("Content-Type"));
                if (!"false".equals(exchange.getRequestHeaders().getFirst("x-upsert"))) {
                    respond(exchange, 400, "{}"); return;
                }
                respond(exchange, failUploads ? 503 : 200, "{}"); return;
            }
            if (path.equals("/object/invoices") && method.equals("DELETE")) {
                if (failDeletes) { respond(exchange, 503, "{}"); return; }
                json.readTree(exchange.getRequestBody()).path("prefixes").forEach(key -> objects.remove(key.asText()));
                respond(exchange, 200, "[]"); return;
            }
            respond(exchange, 404, "{}");
        } catch (RuntimeException ex) {
            respond(exchange, 500, "{}");
        } finally { exchange.close(); }
    }
    private void respond(HttpExchange exchange, int status, String body) throws IOException {
        byte[] bytes = body.getBytes(StandardCharsets.UTF_8);
        exchange.getResponseHeaders().set("Content-Type", "application/json");
        exchange.sendResponseHeaders(status, bytes.length);
        exchange.getResponseBody().write(bytes);
    }
    @Override public void close() { server.stop(0); }
}
