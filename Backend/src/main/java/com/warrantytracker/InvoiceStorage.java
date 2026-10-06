package com.warrantytracker;

/** Storage keys stay internal; only signed download URLs reach API responses. */
interface InvoiceStorage {
    void upload(String key, byte[] bytes, String contentType);
    String signedUrl(String key);
    void delete(String key);
}

