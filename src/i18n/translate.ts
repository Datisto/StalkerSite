import type { Language } from './menu';
import { englishMessages } from './messages';
import { getLanguage } from './language-store';
import { ukrainianErrors } from './errors';

export function translateText(source: string, language: Language, parameters: readonly unknown[] = []): string {
  const key = source.trim();
  if (Object.prototype.hasOwnProperty.call(ukrainianErrors, key)) {
    return language === 'uk' ? source.replace(key, () => ukrainianErrors[key]) : source;
  }
  const invalidType = /^(\w+) must be a string or null$/.exec(key);
  if (invalidType && language === 'uk') return `Поле ${invalidType[1]} має містити текст або бути порожнім`;
  const tooLong = /^(\w+) exceeds (\d+) characters$/.exec(key);
  if (tooLong && language === 'uk') return `Поле ${tooLong[1]} перевищує ліміт ${tooLong[2]} символів`;
  const translated = language === 'en' && Object.prototype.hasOwnProperty.call(englishMessages, key)
    ? source.replace(key, () => englishMessages[key])
    : source;
  return translated.replace(/\{(\d+)\}/g, (placeholder, index: string) =>
    Number(index) < parameters.length ? String(parameters[Number(index)]) : placeholder);
}

// Utilities and independently mounted dialogs share the same selected language.
export function tx(source: string, parameters?: readonly unknown[]) {
  return translateText(source, getLanguage(), parameters);
}
