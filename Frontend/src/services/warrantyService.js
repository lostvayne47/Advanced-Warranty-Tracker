import api from "@/services/api";
import { appConfig } from "@/config/appConfig";
import { mockWarranties } from "@/data/mockData";
import { getStorageItem, setStorageItem } from "@/utils/storage";

function getStoredWarranties() {
  return getStorageItem(appConfig.storageKeys.warranties, mockWarranties);
}

function appendWarrantyFormData(values) {
  const formData = new FormData();
  const fields = [
    "productName",
    "brand",
    "modelNumber",
    "serialNumber",
    "category",
    "purchaseDate",
    "purchasePrice",
    "currency",
    "retailerName",
    "retailerOrderNumber",
    "warrantyProvider",
    "warrantyType",
    "policyNumber",
    "coverageStartDate",
    "expiryDate",
    "coverageTerms",
    "supportPhone",
    "supportEmail",
    "supportUrl",
    "notes",
  ];

  fields.forEach((field) => formData.append(field, values[field] ?? ""));

  if (values.file) {
    formData.append("invoiceImage", values.file);
  }

  return formData;
}

export async function fetchWarranties() {
  if (!appConfig.apiBaseUrl) {
    return getStoredWarranties();
  }

  const { data } = await api.get("/warranties");
  return data;
}

export async function fetchWarranty(id) {
  if (!appConfig.apiBaseUrl) {
    return getStoredWarranties().find((warranty) => warranty.id === id) || null;
  }

  const { data } = await api.get(`/warranties/${id}`);
  return data;
}


export async function createWarranty(values) {
  if (!appConfig.apiBaseUrl) {
    const nextWarranty = {
      id: crypto.randomUUID(),
      ...values,
      fileName: values.file?.name || "",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      version: 0,
    };
    const nextItems = [nextWarranty, ...getStoredWarranties()];
    setStorageItem(appConfig.storageKeys.warranties, nextItems);
    return nextWarranty;
  }

  const { data } = await api.post("/warranties", appendWarrantyFormData(values), {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return data;
}

export async function updateWarranty(id, values) {
  if (!appConfig.apiBaseUrl) {
    const warranties = getStoredWarranties();
    const currentWarranty = warranties.find((warranty) => warranty.id === id);

    if (!currentWarranty) {
      throw new Error("Warranty not found.");
    }

    const updatedWarranty = {
      ...currentWarranty,
      ...values,
      id,
      fileName: values.file?.name || currentWarranty.fileName || "",
      file: undefined,
      updatedAt: new Date().toISOString(),
      version: (currentWarranty.version || 0) + 1,
    };
    setStorageItem(
      appConfig.storageKeys.warranties,
      warranties.map((warranty) => (warranty.id === id ? updatedWarranty : warranty)),
    );
    return updatedWarranty;
  }

  const formData = appendWarrantyFormData(values);
  formData.append("version", values.version ?? 0);
  const { data } = await api.put(`/warranties/${id}`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
}

export async function deleteWarranty(id) {
  if (!appConfig.apiBaseUrl) {
    setStorageItem(appConfig.storageKeys.warranties,
      getStoredWarranties().filter((warranty) => warranty.id !== id));
    return;
  }
  await api.delete(`/warranties/${id}`);
}
