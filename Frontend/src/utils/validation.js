import { validateInvoiceFile } from "./invoiceValidation.js";

export function validateAuth(values, mode = "login") {
  const errors = {};

  if (!values.email?.trim()) {
    errors.email = "Email is required.";
  } else if (!/\S+@\S+\.\S+/.test(values.email)) {
    errors.email = "Enter a valid email address.";
  }

  if (!values.password?.trim()) {
    errors.password = "Password is required.";
  } else if (values.password.length < 6) {
    errors.password = "Password must be at least 6 characters.";
  } else if (new TextEncoder().encode(values.password).length > 72) {
    errors.password = "Password must be at most 72 UTF-8 bytes.";
  }

  if (mode === "signup" && !values.name?.trim()) {
    errors.name = "Full name is required.";
  }

  return errors;
}

export function validateWarranty(values) {
  const errors = {};

  if (!values.productName?.trim()) {
    errors.productName = "Product name is required.";
  }

  if (!values.purchaseDate) {
    errors.purchaseDate = "Purchase date is required.";
  }

  if (!values.expiryDate) {
    errors.expiryDate = "Expiry date is required.";
  }

  if (values.purchaseDate && values.expiryDate) {
    const purchase = new Date(values.purchaseDate);
    const expiry = new Date(values.expiryDate);

    if (expiry < purchase) {
      errors.expiryDate = "Expiry date must be after purchase date.";
    }
  }

  if (values.coverageStartDate && values.purchaseDate) {
    const coverageStart = new Date(values.coverageStartDate);
    const purchase = new Date(values.purchaseDate);

    if (coverageStart < purchase || (values.expiryDate && coverageStart > new Date(values.expiryDate))) {
      errors.coverageStartDate = "Coverage start must be between purchase and expiry dates.";
    }
  }

  if (values.purchasePrice && (!Number.isFinite(Number(values.purchasePrice)) || Number(values.purchasePrice) < 0)) {
    errors.purchasePrice = "Purchase price cannot be negative.";
  }

  if (values.currency && !/^[A-Za-z]{3}$/.test(values.currency)) {
    errors.currency = "Use a three-letter currency code, such as INR.";
  }

  const fileError = validateInvoiceFile(values.file);
  if (fileError) errors.file = fileError;
  return errors;
}
