import test from "node:test";
import assert from "node:assert/strict";
import { sessionExpiresAt } from "../../src/utils/session.js";
import { validateInvoiceFile, MAX_INVOICE_BYTES } from "../../src/utils/invoiceValidation.js";
import { validateWarranty, validateAuth } from "../../src/utils/validation.js";
import { getApiError, getFieldErrors } from "../../src/utils/apiErrors.js";

test("session expiry handles malformed, expired, and demo tokens", () => {
  const token = `header.${Buffer.from(JSON.stringify({ exp: 1700000000 })).toString("base64url")}.signature`;
  assert.equal(sessionExpiresAt(token), 1700000000000);
  assert.equal(sessionExpiresAt("bad-token"), 0);
  assert.equal(sessionExpiresAt("demo-jwt-token"), 0);
  assert.equal(sessionExpiresAt("demo-jwt-token", true), Infinity);
});

test("invoice MIME, empty files and exact size boundary match backend limits", () => {
  for (const type of ["image/jpeg", "image/png", "image/webp"]) {
    assert.equal(validateInvoiceFile({ type, size: MAX_INVOICE_BYTES }), "");
  }
  assert.match(validateInvoiceFile({ type: "image/svg+xml", size: 10 }), /JPEG/);
  assert.match(validateInvoiceFile({ type: "image/png", size: 0 }), /empty/);
  assert.match(validateInvoiceFile({ type: "image/png", size: MAX_INVOICE_BYTES + 1 }), /10 MB/);
});

test("coverage cannot begin after expiry and password limit counts UTF-8 bytes", () => {
  assert.match(validateWarranty({
    productName: "Camera", purchaseDate: "2026-01-01",
    expiryDate: "2027-01-01", coverageStartDate: "2028-01-01",
  }).coverageStartDate, /between/);
  assert.match(validateAuth({ email: "user@example.com", password: "é".repeat(37) }).password, /72/);
});

test("API errors expose actionable messages and map invoice field errors", () => {
  assert.equal(getApiError({ response: { status: 503, data: { message: "Gemini is temporarily busy." } } }), "Gemini is temporarily busy.");
  assert.equal(getApiError({ response: { status: 503, data: { message: "Invoice storage is not configured." } } }), "Invoice storage is not configured.");
  assert.match(getApiError({ response: { status: 503 } }), /service is temporarily unavailable/);
  assert.match(getApiError({ request: {} }), /Cannot reach/);
  assert.match(getApiError({ response: { status: 413 } }), /10 MB/);
  assert.deepEqual(getFieldErrors({ response: { data: { errors: { invoiceImage: "Invalid image", brand: "Too long" } } } }),
    { file: "Invalid image", brand: "Too long" });
  assert.deepEqual(getFieldErrors({ response: { data: { errors: "Invalid" } } }), {});
});
