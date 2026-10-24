import { useTranslation } from '../hooks/useTranslation';
interface BilingualTextFieldProps {
  label: string;
  value: string;
  englishValue?: string | null;
  onChange: (value: string) => void;
  onEnglishChange: (value: string) => void;
  multiline?: boolean;
  required?: boolean;
}

export default function BilingualTextField({
  label, value, englishValue, onChange, onEnglishChange, multiline = false, required = false,
}: BilingualTextFieldProps) {
  const tx = useTranslation();
  const fields = [
    { language: 'uk', caption: tx("UA — основна"), text: value, change: onChange },
    { language: 'en', caption: tx("EN — переклад"), text: englishValue ?? '', change: onEnglishChange },
  ];

  return (
    <div className="grid gap-3 md:grid-cols-2">
      {fields.map((field) => (
        <label key={field.language} className="block min-w-0 text-sm">
          <span className="mb-2 block font-medium">
            {label} ({field.caption}){required && field.language === 'uk' ? ' *' : ''}
          </span>
          {multiline ? (
            <textarea
              lang={field.language}
              value={field.text}
              onChange={(event) => field.change(event.target.value)}
              required={required && field.language === 'uk'}
              rows={3}
              className="w-full rounded border border-gray-600 bg-gray-800 px-3 py-2 focus:border-red-500 focus:outline-none"
            />
          ) : (
            <input
              type="text"
              lang={field.language}
              value={field.text}
              onChange={(event) => field.change(event.target.value)}
              required={required && field.language === 'uk'}
              className="w-full rounded border border-gray-600 bg-gray-800 px-3 py-2 focus:border-red-500 focus:outline-none"
            />
          )}
        </label>
      ))}
    </div>
  );
}
