import { useEffect, useSyncExternalStore, type ReactNode } from 'react';
import { LanguageContext } from './language';
import { menuTranslations } from '../i18n/menu';
import { getLanguage, getServerLanguage, setLanguage, subscribeLanguage } from '../i18n/language-store';

export function LanguageProvider({ children }: { children: ReactNode }) {
  const language = useSyncExternalStore(subscribeLanguage, getLanguage, getServerLanguage);

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t: (key) => menuTranslations[language][key] }}>
      {children}
    </LanguageContext.Provider>
  );
}
