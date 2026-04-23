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

  return errors;
}
