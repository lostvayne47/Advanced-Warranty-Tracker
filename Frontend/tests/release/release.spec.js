import { test, expect } from "@playwright/test";
import { randomUUID } from "node:crypto";

const png = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=", "base64");

test("real signup, create, edit, invoice viewing, user isolation and delete", async ({ page, request }) => {
  const email = `release-${randomUUID()}@example.com`;
  await page.goto("/signup");
  await page.getByLabel("Full name", { exact: true }).fill("Release Tester");
  await page.getByLabel("Email", { exact: true }).fill(email);
  await page.getByLabel("Password", { exact: true }).fill("release-password123");
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
  await page.goto("/add-warranty");
  await page.getByLabel("Product name", { exact: true }).fill("Release camera");
  await page.getByLabel("Purchase date", { exact: true }).fill("2026-01-01");
  await page.getByLabel("Expiry date", { exact: true }).fill("2027-01-01");
  await page.locator('input[type="file"]').setInputFiles({ name: "receipt.png", mimeType: "image/png", buffer: png });
  await expect(page.getByAltText("Invoice preview")).toBeVisible();
  await page.getByRole("button", { name: "Save warranty" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);

  const token = await page.evaluate(() => JSON.parse(localStorage.getItem("warranty-tracker-token")));
  const headers = { Authorization: `Bearer ${token}` };
  const listed = await request.get("/api/warranties", { headers });
  expect(listed.ok()).toBeTruthy();
  const [item] = await listed.json();
  expect(item.productName).toBe("Release camera");
  expect(item.fileName).toBe("receipt.png");
  expect(item).not.toHaveProperty("storageKey");
  const originalUrl = item.invoiceImageUrl;
  expect((await request.get(originalUrl)).status()).toBe(200);
  const unsigned = originalUrl.replace("/object/sign/", "/object/").split("?")[0];
  expect((await request.get(unsigned)).status()).toBe(403);
  const invalidSignature = new URL(originalUrl);
  invalidSignature.searchParams.set("token", "wrong");
  expect((await request.get(invalidSignature.toString())).status()).toBe(403);

  await page.goto("/items");
  await page.getByRole("button", { name: "View invoice", exact: true }).click();
  const viewer = page.getByRole("dialog", { name: "Invoice for Release camera" });
  const image = viewer.getByRole("img");
  await expect.poll(() => image.evaluate((element) => element.naturalWidth)).toBe(1);
  await page.screenshot({ path: test.info().outputPath("receipt-viewer.png") });
  await viewer.getByRole("button", { name: "Close dialog" }).click();
  await page.getByRole("link", { name: "Edit", exact: true }).click();
  await page.getByLabel("Product name", { exact: true }).fill("Updated camera");
  await page.locator('input[type="file"]').setInputFiles({ name: "replacement.png", mimeType: "image/png", buffer: png });
  await expect(page.getByAltText("Invoice preview")).toBeVisible();
  await page.getByRole("button", { name: "Save changes" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
  const updated = await (await request.get(`/api/warranties/${item.id}`, { headers })).json();
  expect(updated.productName).toBe("Updated camera");
  expect(updated.version).toBeGreaterThan(item.version);
  expect(updated.fileName).toBe("replacement.png");
  await expect.poll(async () => (await request.get(originalUrl)).status()).toBe(403);

  // Independent real account must never obtain another user's receipt link.
  const strangerResponse = await request.post("/api/auth/signup", {
    data: { name: "Second account", email: `other-${randomUUID()}@example.com`, password: "release-password123" },
  });
  expect(strangerResponse.status()).toBe(201);
  const stranger = await strangerResponse.json();
  const otherHeaders = { Authorization: `Bearer ${stranger.token}` };
  expect(await (await request.get("/api/warranties", { headers: otherHeaders })).json()).toEqual([]);
  expect((await request.get(`/api/warranties/${item.id}`, { headers: otherHeaders })).status()).toBe(404);
  expect((await request.put(`/api/warranties/${item.id}`, { headers: otherHeaders,
    data: { productName: "Stolen", purchaseDate: "2026-01-01", expiryDate: "2027-01-01", version: updated.version },
  })).status()).toBe(404);
  expect((await request.delete(`/api/warranties/${item.id}`, { headers: otherHeaders })).status()).toBe(404);

  await page.reload();
  await page.goto("/items");
  await page.getByRole("button", { name: "Delete Updated camera", exact: true }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Delete warranty", exact: true }).click();
  await expect(page.getByRole("dialog")).not.toBeVisible();
  expect(await (await request.get("/api/warranties", { headers })).json()).toEqual([]);
  await expect.poll(async () => (await request.get(updated.invoiceImageUrl)).status()).toBe(403);
  expect((await request.get(`/api/warranties/${item.id}`, { headers })).status()).toBe(404);

  await page.getByRole("button", { name: /log out|logout|sign out/i }).click();
  await expect(page).toHaveURL(/\/login$/);
  await page.getByLabel("Email", { exact: true }).fill(email);
  await page.getByLabel("Password", { exact: true }).fill("release-password123");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page).not.toHaveURL(/\/login$/);
});

test("public readiness is minimal and API remains protected", async ({ request }) => {
  const ready = await request.get("/actuator/health/readiness");
  expect(ready.status()).toBe(200);
  expect(await ready.json()).toEqual({ status: "UP" });
  expect((await request.get("/api/warranties")).status()).toBe(401);
  expect((await request.get("/actuator/env")).status()).toBe(401);
  expect((await request.get("/dashboard")).status()).toBe(200);
});
