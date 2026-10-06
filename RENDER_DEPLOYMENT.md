# Render tester deployment

The root `render.yaml` builds the existing Dockerfile and serves React and the
Spring Boot API on one HTTPS origin. Supabase stores accounts, warranties, and
private invoice images. No Render database or persistent disk is required.

## Launch

1. Push the deployment files to the GitHub `main-frontend` branch.
2. In Render, create a Blueprint from
   `https://github.com/lostvayne47/Advanced-Warranty-Tracker`, selecting that
   branch. Review the free web service in Singapore before creating it.
3. Supply the prompted environment variables from your local `Backend/.env`.
   Keep all credentials in Render's environment settings.
4. For database access, copy the session-pooler host and exact username from
   Supabase's Connect dialog. This provides IPv4 compatibility independently
   of the local machine's working IPv6 direct connection:

   ```dotenv
   SUPABASE_DB_URL=jdbc:postgresql://YOUR_POOLER_HOST:5432/postgres?sslmode=require
   SUPABASE_DB_USERNAME=postgres.ptrqhwpfmybqccbxxauc
   SUPABASE_URL=https://ptrqhwpfmybqccbxxauc.supabase.co
   ```

   The database password stays separate and is not percent-encoded. Use the
   legacy service_role key expected by the existing storage client.
5. Render generates a separate JWT secret. Keep it stable across deployments.
   Existing local login tokens will require signing in again on the hosted app.
6. Deploy and wait for readiness. `RENDER_EXTERNAL_URL` automatically supplies
   the allowed frontend origin. If adding a custom domain, set `CORS_ORIGINS`
   explicitly to its HTTPS origin (comma-separated for multiple origins).

The blueprint disables automatic redeployment; deploy changes manually after
verification. The free service sleeps after inactivity and can take time to
wake. Gemini is optional: leave its API key empty to use manual invoice entry.
The model is set to the locally verified `gemini-3.6-flash`; change it if needed.

## Verify before sharing

- Check `/actuator/health/readiness` reports `UP`.
- Open `/signup`, create a test account, and add a warranty with an image.
- Refresh the dashboard and view the saved invoice.
- Replace the invoice and confirm the previous storage object is cleaned up.
- Use a second account to verify the first account's warranties are inaccessible.
- Delete the test warranty and verify its invoice object is cleaned up.
- Repeat invoice viewing on a mobile browser.

This service uses the same Supabase project as local development: existing
accounts and warranties are shared. Record the actual hosted URL and results in
`HANDOFF.md`, and mark deployment tasks complete only after hosted checks pass.

References: https://render.com/docs/blueprint-spec,
https://render.com/docs/docker, https://render.com/docs/free.
