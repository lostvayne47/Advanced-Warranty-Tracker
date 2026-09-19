import { test, expect } from "@playwright/test";

const API = "http://127.0.0.1:5001";
const png = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=", "base64");

test('Gemini suggestions require review and leave existing entries unchanged until applied', async ({ page }) => {
  test.setTimeout(120000);
  const state = await setup(page);
  await page.route('**/api/invoice-extractions', (route) => {
    expect(route.request().headers()['content-type']).toContain('multipart/form-data; boundary=');
    expect(route.request().postData()).toContain('name="invoiceImage"');
    return route.fulfill({ json: { fields: { productName: 'Camera', purchaseDate: '2026-01-20' }, warnings: ['Warranty expiry was not stated.'] } });
  });
  await page.goto('/add-warranty');
  await page.getByLabel('Product name', { exact: true }).fill('My entry');
  const data = await page.evaluate(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 1100; canvas.height = 500;
    const context = canvas.getContext('2d');
    context.fillStyle = 'white'; context.fillRect(0, 0, 1100, 500);
    context.fillStyle = 'black'; context.font = '36px Arial';
    ['INVOICE', 'Product: Camera', 'Invoice date: 2026-01-20', 'Total: INR 1200.00'].forEach((line, i) => context.fillText(line, 50, 80 + i * 80));
    return canvas.toDataURL('image/png').split(',')[1];
  });
  await page.locator('input[type=file]').setInputFiles({ name: 'ocr.png', mimeType: 'image/png', buffer: Buffer.from(data, 'base64') });
  await page.getByRole('button', { name: 'Extract invoice details' }).click();
  const dialog = page.getByRole('dialog', { name: 'Review extracted invoice' });
  await expect(dialog).toBeVisible({ timeout: 90000 });
  await expect(dialog.getByText('Warranty expiry was not stated.')).toBeVisible();
  await expect(page.getByLabel('Product name', { exact: true })).toHaveValue('My entry');
  await expect(dialog.getByRole('button', { name: 'Apply selected details' })).toBeDisabled();
  await dialog.getByRole('checkbox', { name: /product name: Camera/i }).check();
  await dialog.getByRole('button', { name: 'Apply selected details' }).click();
  await expect(page.getByLabel('Product name', { exact: true })).toHaveValue('Camera');
  await expect(page.getByLabel('Purchase date', { exact: true })).toHaveValue('');
  expect(state.writes).toEqual([]);
});
function jwt(seconds = 3600) {
  return `header.${Buffer.from(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + seconds })).toString("base64url")}.signature`;
}

test('Gemini cancellation restores the form without saving or replacing entries', async ({ page }) => {
  const state = await setup(page);
  await page.route('**/api/invoice-extractions', async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 1500));
    await route.fulfill({ json: { fields: { productName: 'Late result' }, warnings: [] } }).catch(() => {});
  });
  await page.goto('/add-warranty');
  await page.getByLabel('Product name', { exact: true }).fill('Keep this');
  await page.locator('input[type=file]').setInputFiles({ name: 'blank.png', mimeType: 'image/png', buffer: png });
  await page.getByRole('button', { name: 'Extract invoice details' }).click();
  await page.getByRole('button', { name: 'Cancel extraction' }).click();
  await expect(page.getByRole('button', { name: 'Save warranty', exact: true })).toBeEnabled();
  await expect(page.getByLabel('Product name', { exact: true })).toHaveValue('Keep this');
  await expect(page.getByRole('dialog')).not.toBeVisible();
  await page.waitForTimeout(1700);
  await expect(page.getByLabel('Product name', { exact: true })).toHaveValue('Keep this');
  await expect(page.getByRole('dialog')).not.toBeVisible();
  expect(state.writes).toEqual([]);
});
test('Gemini configuration failure preserves manual form and select all applies suggestions', async ({ page }) => {
  const state = await setup(page);
  let fail = true;
  await page.route('**/api/invoice-extractions', route => route.fulfill(fail
    ? { status: 503, json: { message: 'Gemini invoice parsing is not configured.' } }
    : { json: { fields: { productName: 'Camera', purchaseDate: '2026-01-20' }, warnings: [] } }));
  await page.goto('/add-warranty');
  await page.getByLabel('Product name', { exact: true }).fill('Keep this');
  await page.locator('input[type=file]').setInputFiles({ name: 'invoice.png', mimeType: 'image/png', buffer: png });
  await page.getByRole('button', { name: 'Extract invoice details' }).click();
  await expect(page.getByText('Gemini invoice parsing is not configured.', { exact: true })).toBeVisible();
  await expect(page.getByLabel('Product name', { exact: true })).toHaveValue('Keep this');
  fail = false;
  await page.getByRole('button', { name: 'Extract invoice details' }).click();
  await page.getByRole('button', { name: 'Select all suggestions' }).click();
  await page.getByRole('button', { name: 'Apply selected details' }).click();
  await expect(page.getByLabel('Product name', { exact: true })).toHaveValue('Camera');
  await expect(page.getByLabel('Purchase date', { exact: true })).toHaveValue('2026-01-20');
  expect(state.writes).toEqual([]);
});
async function setup(page, options = {}) {
  const state = {
    token: jwt(), deletes: 0, reads: 0, writes: [], failDelete: false,
    failList: false, failDetail: false, unauthorized: false, writeStatus: 200,
    ...options,
    items: [{
      id: "item-1", productName: "Camera", purchaseDate: "2026-01-01",
      expiryDate: "2027-01-01", version: 0, currency: "INR",
      warrantyType: "MANUFACTURER", brand: null, notes: null,
      fileName: "receipt.png", invoiceImageUrl: API + "/expired.png",
    }],
  };
  await page.addInitScript(({ token }) => {
    if (sessionStorage.getItem("seeded")) return;
    sessionStorage.setItem("seeded", "yes");
    if (token) {
      localStorage.setItem("warranty-tracker-token", JSON.stringify(token));
      localStorage.setItem("warranty-tracker-user", JSON.stringify({ id: "user-1", name: "User", email: "user@example.com" }));
    }
  }, { token: state.token });
  await page.route(API + "/invoice.png*", (route) => route.fulfill({ contentType: "image/png", body: png }));
  await page.route(API + "/expired.png", (route) => route.fulfill({ status: 403 }));
  await page.route(API + "/api/**", async (route) => {
    const request = route.request();
    const path = new URL(request.url()).pathname;
    const method = request.method();
    const respond = (status, json) => route.fulfill({ status, json,
      headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "*" } });
    if (method === "OPTIONS") return route.fulfill({ status: 204, headers: {
      "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE", "Access-Control-Allow-Headers": "*",
    } });
    if (path === "/api/auth/login") return respond(401, { message: "Invalid email or password." });
    if (state.unauthorized) return respond(401, { message: "Please sign in again." });
    if (path === "/api/warranties" && method === "GET") {
      return respond(state.failList ? 503 : 200, state.failList ? { message: "Storage offline" } : state.items);
    }
    if (method === "DELETE") {
      state.deletes++;
      if (state.failDelete) return respond(500, { message: "Unable to delete. Try again." });
      state.items = [];
      return route.fulfill({ status: 204, headers: { "Access-Control-Allow-Origin": "*" } });
    }
    if (method === "GET") {
      state.reads++;
      if (state.failDetail) return respond(503, { message: "Storage unavailable." });
      return respond(200, { ...state.items[0], invoiceImageUrl: API + "/invoice.png?signature=" + state.reads });
    }
    if (method === "PUT" || method === "POST") {
      state.writes.push(request.postData());
      if (state.writeStatus === 409) return respond(409, { message: "Warranty changed. Reload it before saving." });
      if (state.writeStatus === 400) return respond(400, { message: "Please check the submitted fields.", errors: { brand: "Brand is too long." } });
      if (state.writeStatus === 503) return respond(503, { message: "Storage unavailable." });
      return respond(method === "POST" ? 201 : 200, { ...state.items[0], version: 1 });
    }
    return respond(404, { message: "Not found" });
  });
  return state;
}

test("delete cancellation, failure, and successful retry keep inventory correct", async ({ page }) => {
  const state = await setup(page);
  await page.goto("/items");
  await page.getByRole("button", { name: "Delete Camera", exact: true }).click();
  await page.getByRole("button", { name: "Cancel", exact: true }).click();
  expect(state.deletes).toBe(0);
  state.failDelete = true;
  await page.getByRole("button", { name: "Delete Camera", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "Delete warranty?" });
  await dialog.getByRole("button", { name: "Delete warranty", exact: true }).click();
  await expect(dialog.getByRole("alert")).toContainText("Unable to delete");
  expect(state.items).toHaveLength(1);
  state.failDelete = false;
  await dialog.getByRole("button", { name: "Delete warranty", exact: true }).click();
  await expect(dialog).not.toBeVisible();
  await expect(page.getByRole("button", { name: "Delete Camera", exact: true })).toHaveCount(0);
  expect(state.deletes).toBe(2);
});

test("invoice opens with a fresh URL and recovers from an expired image link", async ({ page }) => {
  await setup(page);
  await page.goto("/items");
  await page.getByRole("button", { name: "View invoice", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "Invoice for Camera" });
  const image = dialog.getByRole("img", { name: "Saved invoice for Camera" });
  await expect(image).toBeVisible();
  await expect.poll(() => image.evaluate((img) => img.naturalWidth)).toBe(1);
  const firstUrl = await image.getAttribute("src");
  await image.dispatchEvent("error");
  await expect(dialog.getByRole("alert")).toContainText("expired");
  await dialog.getByRole("button", { name: "Refresh invoice" }).click();
  await expect(image).toBeVisible();
  await expect(image).not.toHaveAttribute("src", firstUrl);
  await expect(dialog.getByRole("link", { name: "Open full-size invoice" })).toHaveAttribute("target", "_blank");
  await page.keyboard.press("Escape");
  await expect(dialog).not.toBeVisible();
});

test("protected API 401 clears session and explains login redirect", async ({ page }) => {
  await setup(page, { unauthorized: true });
  await page.goto("/items");
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByText("Your session expired. Sign in again to continue.")).toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem("warranty-tracker-token"))).toBeNull();
});

test("expired stored JWT redirects before loading inventory", async ({ page }) => {
  await setup(page, { token: jwt(-60) });
  await page.goto("/items");
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByText("Your session expired. Sign in again to continue.")).toBeVisible();
});

test("invalid login shows credentials error without calling it session expiry", async ({ page }) => {
  await setup(page, { token: null });
  await page.goto("/login");
  await page.getByLabel("Email", { exact: true }).fill("user@example.com");
  await page.getByLabel("Password", { exact: true }).fill("wrong123");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page.getByText("Invalid email or password.")).toBeVisible();
  await expect(page.getByText("Your session expired. Sign in again to continue.")).toHaveCount(0);
});

test("load errors offer retry rather than presenting an empty inventory", async ({ page }) => {
  const state = await setup(page, { failList: true });
  await page.goto("/items");
  await expect(page.getByRole("alert")).toContainText("Invoice storage is unavailable");
  state.failList = false;
  await page.getByRole("button", { name: "Try again" }).click();
  await expect(page.getByRole("button", { name: "Delete Camera", exact: true })).toBeVisible();
});

test("failed edit load prevents blank save and recovers without null input warnings", async ({ page }) => {
  const state = await setup(page, { failDetail: true });
  const warnings = [];
  page.on("console", (message) => { if (message.type() === "error") warnings.push(message.text()); });
  await page.goto("/warranties/item-1/edit");
  await expect(page.getByRole("alert")).toBeVisible();
  await expect(page.getByRole("button", { name: "Save changes" })).toHaveCount(0);
  state.failDetail = false;
  await page.getByRole("button", { name: "Try again" }).click();
  await expect(page.getByLabel("Brand", { exact: true })).toHaveValue("");
  await page.getByRole("button", { name: "View saved invoice" }).click();
  await expect(page.getByRole("dialog", { name: "Invoice for Camera" })).toBeVisible();
  expect(warnings.filter((value) => /controlled|should not be null/i.test(value))).toEqual([]);
});

test("stale save preserves edits and requires explicit reload", async ({ page }) => {
  const state = await setup(page, { writeStatus: 409 });
  await page.goto("/warranties/item-1/edit");
  await page.getByLabel("Product name", { exact: true }).fill("My changed camera");
  await page.getByRole("button", { name: "Save changes" }).click();
  await expect(page.getByRole("alert")).toContainText("Warranty changed");
  await expect(page.getByLabel("Product name", { exact: true })).toHaveValue("My changed camera");
  await expect(page.getByRole("button", { name: "Save changes" })).toBeDisabled();
  expect(state.writes[0]).toContain('name="version"');
  state.items[0].version = 1;
  state.items[0].productName = "Latest camera";
  page.once("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: "Reload latest warranty" }).click();
  await expect(page.getByLabel("Product name", { exact: true })).toHaveValue("Latest camera");
  await expect(page.getByRole("button", { name: "Save changes" })).toBeEnabled();
});

test("server validation displays field detail and storage errors retain the form", async ({ page }) => {
  const state = await setup(page, { writeStatus: 400 });
  await page.goto("/warranties/item-1/edit");
  await page.getByLabel("Brand", { exact: true }).fill("My brand");
  await page.getByRole("button", { name: "Save changes" }).click();
  await expect(page.getByText("Brand: Brand is too long.")).toBeVisible();
  state.writeStatus = 503;
  await page.getByRole("button", { name: "Save changes" }).click();
  await expect(page.getByRole("alert")).toContainText("Invoice storage is unavailable");
  await expect(page.getByLabel("Brand", { exact: true })).toHaveValue("My brand");
});

test("invalid or oversized replacement clears old selection and valid upload is multipart", async ({ page }) => {
  const state = await setup(page);
  await page.goto("/warranties/item-1/edit");
  const file = page.locator('input[type="file"]');
  await expect(file).toHaveAttribute("accept", "image/jpeg,image/png,image/webp");
  await file.setInputFiles({ name: "valid.png", mimeType: "image/png", buffer: png });
  await expect(page.getByAltText("Invoice preview")).toBeVisible();
  await file.setInputFiles({ name: "bad.svg", mimeType: "image/svg+xml", buffer: Buffer.from("<svg/>") });
  await expect(page.getByText("Choose a JPEG, PNG, or WebP invoice image.")).toBeVisible();
  await expect(page.getByAltText("Invoice preview")).toHaveCount(0);
  await file.setInputFiles({ name: "large.png", mimeType: "image/png", buffer: Buffer.alloc(10 * 1024 * 1024 + 1) });
  await expect(page.getByText("Choose an invoice image up to 10 MB.")).toBeVisible();
  await page.getByRole("button", { name: "Save changes" }).click();
  expect(state.writes).toHaveLength(0);
  await file.setInputFiles({ name: "replacement.png", mimeType: "image/png", buffer: png });
  await expect(page.getByAltText("Invoice preview")).toBeVisible();
  await page.getByRole("button", { name: "Save changes" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
  expect(state.writes).toHaveLength(1);
  expect(state.writes[0]).toContain('name="invoiceImage"; filename="replacement.png"');
});
