package com.warrantytracker;

class StorageUnavailableException extends RuntimeException {
    StorageUnavailableException() { super("Invoice storage is temporarily unavailable. Please try again."); }
    StorageUnavailableException(String message) { super(message); }
}
