/**
 * Utility to recursively remove any properties with `undefined` values from objects
 * before sending to Firestore (Firestore rejects `undefined` values).
 * 
 * Preserves Firestore FieldValue sentinels (serverTimestamp, increment, arrayUnion, etc.),
 * Dates, and Timestamps.
 */
export function stripUndefined<T>(obj: T): T {
  if (obj === null || obj === undefined || typeof obj !== 'object') {
    return obj;
  }

  // Preserve Date instances
  if (obj instanceof Date) {
    return obj;
  }

  // Preserve and clean arrays recursively
  if (Array.isArray(obj)) {
    return obj
      .filter((item) => item !== undefined)
      .map((item) => stripUndefined(item)) as unknown as T;
  }

  // Only strip keys from plain JavaScript objects, preserving custom Firestore classes/sentinels
  const isPlainObject =
    obj.constructor === Object ||
    Object.prototype.toString.call(obj) === '[object Object]';

  if (!isPlainObject) {
    return obj;
  }

  const cleaned: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      cleaned[key] = stripUndefined(value);
    }
  }

  return cleaned as T;
}
