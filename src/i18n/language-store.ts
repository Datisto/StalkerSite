import type { Language } from './menu';

const STORAGE_KEY = 'eternal-zone-language';
let language: Language = 'uk';
try {
  language = localStorage.getItem(STORAGE_KEY) === 'en' ? 'en' : 'uk';
} catch {
  // Ukrainian remains the default when storage is unavailable.
}
const listeners = new Set<() => void>();

export const getLanguage = () => language;
export const getServerLanguage = (): Language => 'uk';
export function subscribeLanguage(listener: () => void) {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}

export function setLanguage(next: Language) {
  if (next === language) return;
  language = next;
  try {
    localStorage.setItem(STORAGE_KEY, next);
  } catch {
    // Switching still works when browser storage is disabled.
  }
  listeners.forEach((listener) => listener());
}
