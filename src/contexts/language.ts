import { createContext, useContext } from 'react';
import type { Language, MenuKey } from '../i18n/menu';

interface LanguageContextValue {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: MenuKey) => string;
}

export const LanguageContext = createContext<LanguageContextValue | undefined>(undefined);

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return context;
}
