// Undefined means "leave unchanged" on PATCH; empty strings explicitly clear a translation.
export function translationFields(body, fields) {
  const translations = {};
  for (const [field, maxLength] of Object.entries(fields)) {
    const value = body[field];
    if (value === undefined) continue;
    if (value !== null && typeof value !== 'string') {
      throw Object.assign(new Error(`${field} must be a string or null`), { status: 400 });
    }
    const text = value?.trim() || null;
    if (text && maxLength && Array.from(text).length > maxLength) {
      throw Object.assign(new Error(`${field} exceeds ${maxLength} characters`), { status: 400 });
    }
    translations[field] = text;
  }
  return translations;
}
