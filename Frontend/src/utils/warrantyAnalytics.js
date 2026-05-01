import { daysUntil, getWarrantyStatus } from "@/utils/date";

const statusOrder = ["Active", "Expiring Soon", "Expired"];
const statusTone = {
  Active: "success",
  "Expiring Soon": "warning",
  Expired: "danger",
};

export function getWarrantyAnalytics(warranties) {
  const statusCounts = statusOrder.map((label) => ({ label, tone: statusTone[label], value: 0 }));

  warranties.forEach((warranty) => {
    const status = getWarrantyStatus(warranty.expiryDate);
    const match = statusCounts.find((item) => item.label === status.label);

    if (match) {
      match.value += 1;
    }
  });

  return {
    total: warranties.length,
    statusCounts,
    upcomingExpirations: getUpcomingExpirations(warranties),
    alerts: getAlerts(warranties),
  };
}

function getUpcomingExpirations(warranties) {
  const today = new Date();
  const buckets = Array.from({ length: 6 }, (_, index) => {
    const date = new Date(today.getFullYear(), today.getMonth() + index, 1);

    return {
      key: `${date.getFullYear()}-${date.getMonth()}`,
      label: date.toLocaleDateString("en-US", { month: "short" }),
      count: 0,
    };
  });

  warranties.forEach((warranty) => {
    const expiry = new Date(warranty.expiryDate);
    const match = buckets.find((bucket) => bucket.key === `${expiry.getFullYear()}-${expiry.getMonth()}`);

    if (match && daysUntil(warranty.expiryDate) >= 0) {
      match.count += 1;
    }
  });

  return buckets;
}

function getAlerts(warranties) {
  return warranties
    .map((warranty) => ({
      ...warranty,
      remainingDays: daysUntil(warranty.expiryDate),
      status: getWarrantyStatus(warranty.expiryDate),
    }))
    .filter((warranty) => warranty.remainingDays >= 0 && warranty.remainingDays <= 30)
    .sort((a, b) => a.remainingDays - b.remainingDays)
    .slice(0, 5);
}
