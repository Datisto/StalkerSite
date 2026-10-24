import { useCallback, useSyncExternalStore } from 'react';
import { getLanguage, getServerLanguage, subscribeLanguage } from '../i18n/language-store';
import { translateText } from '../i18n/translate';

export function useTranslation() {
  const language = useSyncExternalStore(subscribeLanguage, getLanguage, getServerLanguage);
  return useCallback((source: string, parameters?: readonly unknown[]) =>
    translateText(source, language, parameters), [language]);
}
