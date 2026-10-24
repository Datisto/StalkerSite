import { useTranslation } from '../hooks/useTranslation';
import { useLanguage } from '../contexts/language';

export default function LanguageSwitcher() {
  const tx = useTranslation();
  const { language, setLanguage, t } = useLanguage();

  return (
    <div role="group" aria-label={t('language')} className="inline-flex shrink-0 rounded border border-gray-600 bg-gray-900 p-1">
      {(['uk', 'en'] as const).map((option) => (
        <button
          key={option}
          type="button"
          lang={option}
          aria-label={option === 'uk' ? tx("Українська") : 'English'}
          aria-pressed={language === option}
          onClick={() => setLanguage(option)}
          className={`rounded px-3 py-2 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 ${
            language === option ? 'bg-red-600 text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white'
          }`}
        >
          {option === 'uk' ? 'UA' : 'EN'}
        </button>
      ))}
    </div>
  );
}
