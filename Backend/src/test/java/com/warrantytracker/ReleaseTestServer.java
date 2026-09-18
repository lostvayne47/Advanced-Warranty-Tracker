package com.warrantytracker;

import io.zonky.test.db.postgres.embedded.EmbeddedPostgres;
import java.nio.file.*;
import java.sql.*;
import java.util.concurrent.TimeUnit;

/**
 * Local release-test fixture only. Launches the real packaged API with isolated
 * PostgreSQL and a Storage HTTP double; never included in the production JAR.
 */
public class ReleaseTestServer {
    public static void main(String[] args) throws Exception {
        EmbeddedPostgres pg = EmbeddedPostgres.builder().setPort(0).start();
        FakeSupabase storage = new FakeSupabase();
        try (Connection connection = pg.getPostgresDatabase().getConnection(); Statement sql = connection.createStatement()) {
            sql.execute("CREATE ROLE anon");
            sql.execute("CREATE ROLE authenticated");
            sql.execute("CREATE SCHEMA storage");
            sql.execute("CREATE TABLE storage.buckets (id text primary key, name text, public boolean, file_size_limit bigint, allowed_mime_types text[])");
        }
        String java = Path.of(System.getProperty("java.home"), "bin", "java").toString();
        ProcessBuilder builder = new ProcessBuilder(java, "-jar", "target/backend-0.0.1-SNAPSHOT.jar",
            "--spring.profiles.active=supabase", "--server.address=127.0.0.1",
            "--server.port=5002", "--app.storage.cleanup-delay-ms=500",
            "--debug=false");
        builder.environment().put("SUPABASE_DB_URL", pg.getJdbcUrl("postgres", "postgres"));
        builder.environment().put("SUPABASE_DB_USERNAME", "postgres");
        builder.environment().put("SUPABASE_DB_PASSWORD", "postgres");
        builder.environment().put("SUPABASE_URL", storage.url());
        builder.environment().put("SUPABASE_SERVICE_ROLE_KEY", "test-service-key");
        builder.environment().put("JWT_SECRET", "local-release-test-only-secret-never-deploy-this-value");
        builder.environment().put("CORS_ORIGINS", "http://127.0.0.1:5002");
        Process backend = builder.inheritIO().start();
        Runnable close = () -> {
            backend.destroy();
            try {
                if (!backend.waitFor(15, TimeUnit.SECONDS)) backend.destroyForcibly();
                storage.close();
                pg.close();
            } catch (Exception ignored) { /* JVM shutdown cleanup */ }
        };
        Runtime.getRuntime().addShutdownHook(new Thread(close, "release-test-cleanup"));
        // The Node parent closes stdin during teardown; this also works on Windows.
        Thread input = new Thread(() -> {
            try { System.in.read(); } catch (Exception ignored) {}
            close.run();
        }, "release-test-parent");
        input.setDaemon(true);
        input.start();
        int code = backend.waitFor();
        close.run();
        System.exit(code);
    }
}
