export function getStorageItem(key, fallback = null) {
  try {
    const item = window.localStorage.getItem(key);
    return item ? JSON.parse(item) : fallback;
  } catch {
    return fallback;
  }
}

export function setStorageItem(key, value) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore storage write failures.
  }
}

export function removeStorageItem(key) {
  try {
    window.localStorage.removeItem(key);
  } catch {
    // Ignore storage remove failures.
  }
}
