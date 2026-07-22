/**
 * Typed browser-storage access.
 *
 * Every localStorage read in the app goes through here so that quota errors,
 * private-browsing failures and corrupt JSON are handled once instead of
 * being re-implemented (or forgotten) at each call site.
 */

/**
 * Reads and parses a stored value.
 *
 * Returns `fallback` when the key is absent, unparseable, or fails `validate`.
 * A stored value that does not match the expected shape is treated as absent
 * rather than trusted, because it is attacker- and bug-reachable.
 */
export const readJson = <T>(
  key: string,
  fallback: T,
  validate?: (value: unknown) => value is T
): T => {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return fallback;

    const parsed: unknown = JSON.parse(raw);

    if (validate) return validate(parsed) ? parsed : fallback;

    return parsed as T;
  } catch (error) {
    console.error(`Failed to read "${key}" from storage:`, error);
    return fallback;
  }
};

/** Serializes and stores a value. Returns false when storage rejected it. */
export const writeJson = (key: string, value: unknown): boolean => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    console.error(`Failed to write "${key}" to storage:`, error);
    return false;
  }
};

/** Removes a key, ignoring storage failures. */
export const removeKey = (key: string): void => {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.error(`Failed to remove "${key}" from storage:`, error);
  }
};

/** Reads a raw string without parsing. */
export const readRaw = (key: string): string | null => {
  try {
    return localStorage.getItem(key);
  } catch (error) {
    console.error(`Failed to read "${key}" from storage:`, error);
    return null;
  }
};
