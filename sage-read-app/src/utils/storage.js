// Safe LocalStorage helpers for SPA state persistence.
// LocalStorage may throw (e.g., privacy mode, quota exceeded), so we guard all accesses.

function safeParseJson(value) {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function withLocalStorage(fn) {
  try {
    if (typeof window === "undefined" || !window.localStorage) return null;
    return fn(window.localStorage);
  } catch {
    return null;
  }
}

export function saveStateToStorage(key, data) {
  withLocalStorage((storage) => {
    storage.setItem(key, JSON.stringify(data));
    return true;
  });
}

export function loadStateFromStorage(key, fallback = null) {
  const result = withLocalStorage((storage) => {
    const raw = storage.getItem(key);
    if (raw == null) return fallback;
    const parsed = safeParseJson(raw);
    return parsed == null ? fallback : parsed;
  });

  return result === null ? fallback : result;
}

export function clearStateFromStorage(key) {
  withLocalStorage((storage) => {
    storage.removeItem(key);
    return true;
  });
}
