# syntax=docker/dockerfile:1
FROM node:22-bookworm-slim AS frontend
WORKDIR /work/Frontend
COPY Frontend/package.json Frontend/package-lock.json ./
RUN npm ci
COPY Frontend/ ./
ENV VITE_API_URL=/api
RUN npm run build

FROM eclipse-temurin:21-jdk-jammy AS backend
WORKDIR /work/Backend
COPY Backend/ ./
COPY --from=frontend /work/Frontend/dist /work/Frontend/dist
RUN sed -i 's/\r$//' mvnw && chmod +x mvnw \
    && ./mvnw -q -Dmaven.test.skip=true -Pbundle-frontend package

FROM eclipse-temurin:21-jre-jammy AS runtime
RUN apt-get update \
    && apt-get install -y --no-install-recommends curl fontconfig \
    && rm -rf /var/lib/apt/lists/* \
    && groupadd --system --gid 10001 appuser \
    && useradd --system --uid 10001 --gid 10001 --create-home appuser
WORKDIR /app
COPY --from=backend --chown=10001:10001 /work/Backend/target/backend-0.0.1-SNAPSHOT.jar /app/app.jar
USER 10001:10001
ENV PORT=8080 SPRING_PROFILES_ACTIVE=supabase
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=5s --start-period=90s --retries=3 \
    CMD curl --fail --silent http://127.0.0.1:${PORT}/actuator/health/readiness || exit 1
ENTRYPOINT ["java", "-XX:MaxRAMPercentage=65.0", "-Djava.awt.headless=true", "-jar", "/app/app.jar"]
