import api from "@/services/api";
import { appConfig } from "@/config/appConfig";
import { mockWarranties } from "@/data/mockData";
import { getStorageItem, setStorageItem } from "@/utils/storage";

function getStoredWarranties() {
  return getStorageItem(appConfig.storageKeys.warranties, mockWarranties);
}

export async function fetchWarranties() {
  if (!appConfig.apiBaseUrl) {
    return getStoredWarranties();
  }

  const { data } = await api.get("/warranties");
  return data;
}

export async function createWarranty(values) {
  if (!appConfig.apiBaseUrl) {
    const nextWarranty = {
      id: crypto.randomUUID(),
      ...values,
      fileName: values.file?.name || "",
    };
    const nextItems = [nextWarranty, ...getStoredWarranties()];
    setStorageItem(appConfig.storageKeys.warranties, nextItems);
    return nextWarranty;
  }

  const formData = new FormData();
  formData.append("productName", values.productName);
  formData.append("purchaseDate", values.purchaseDate);
  formData.append("expiryDate", values.expiryDate);
  formData.append("notes", values.notes || "");

  if (values.file) {
    formData.append("file", values.file);
  }

  const { data } = await api.post("/warranties", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return data;
}
