export function formatDate(date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(date));
}

export function daysUntil(date) {
  const diff = new Date(date).setHours(0, 0, 0, 0) - new Date().setHours(0, 0, 0, 0);
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export function getWarrantyStatus(expiryDate) {
  const remainingDays = daysUntil(expiryDate);

  if (remainingDays < 0) {
    return { label: "Expired", tone: "danger" };
  }

  if (remainingDays <= 30) {
    return { label: "Expiring Soon", tone: "warning" };
  }

  return { label: "Active", tone: "success" };
}
