import type { Language } from './menu';

export function localizedText(original: string, english: string | null | undefined, language: Language): string {
  return language === 'en' && english?.trim() ? english : original;
}
