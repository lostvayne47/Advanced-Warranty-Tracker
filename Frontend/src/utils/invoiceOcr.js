// Conservative suggestions: labelled fields only; no invented coverage duration.
export function parseInvoiceText(text) {
  const fields = {};
  const labels = { productName: 'product(?: name)?|item', brand: 'brand', modelNumber: 'model(?: number)?',
    serialNumber: 'serial(?: number)?', retailerName: 'retailer|seller', retailerOrderNumber: 'order(?: number| no\\.?)?' };
  for (const [field, label] of Object.entries(labels)) {
    const match = text.match(new RegExp(`^(?:${label})\\s*[:#]\\s*(.+)$`, 'im'));
    if (match) fields[field] = match[1].trim().slice(0, 200);
  }
  const date = text.match(/^(?:purchase date|invoice date|date)\s*:\s*(\d{4}-\d{2}-\d{2})\s*$/im)?.[1];
  if (date && !Number.isNaN(Date.parse(date)) && new Date(date).toISOString().slice(0, 10) === date) fields.purchaseDate = date;
  // Require currency and a decimal point; ambiguous local number formats stay manual.
  const amount = text.match(/^(?:grand total|total)\s*:\s*(INR|USD|EUR|GBP)\s+(\d{1,9}\.\d{2})\s*$/im);
  if (amount) { fields.currency = amount[1].toUpperCase(); fields.purchasePrice = amount[2]; }
  return fields;
}
