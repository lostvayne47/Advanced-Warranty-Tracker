// Used only to schedule logout; the API remains responsible for verifying JWTs.
export function sessionExpiresAt(token, demoMode = false) {
  if (demoMode && token === "demo-jwt-token") return Infinity;
  try {
    const encoded = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    const { exp } = JSON.parse(atob(encoded.padEnd(Math.ceil(encoded.length / 4) * 4, "=")));
    return typeof exp === "number" && Number.isFinite(exp) ? exp * 1000 : 0;
  } catch {
    return 0;
  }
}

