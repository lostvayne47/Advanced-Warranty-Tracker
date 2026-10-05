export const INVOICE_ACCEPT = "image/jpeg,image/png,image/webp";
export const MAX_INVOICE_BYTES = 10 * 1024 * 1024;

export function validateInvoiceFile(file) {
  if (!file) return "";
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
    return "Choose a JPEG, PNG, or WebP invoice image.";
  }
  if (file.size === 0) return "The invoice image is empty.";
  if (file.size > MAX_INVOICE_BYTES) return "Choose an invoice image up to 10 MB.";
  return "";
}

export async function inspectInvoiceImage(file) {
  const error = validateInvoiceFile(file);
  if (error || !file) return error;
  let bitmap;
  try {
    bitmap = await createImageBitmap(file);
    if (bitmap.width > 12000 || bitmap.height > 12000 || bitmap.width * bitmap.height > 20000000) {
      return "Choose an invoice up to 20 megapixels and 12,000 pixels per side.";
    }
    return "";
  } catch {
    return "This image could not be read. Choose a different invoice image.";
  } finally {
    bitmap?.close();
  }
}
