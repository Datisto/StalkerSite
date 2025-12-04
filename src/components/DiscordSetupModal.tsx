import { useState, useEffect } from 'react';
import { Hash } from 'lucide-react';

interface DiscordSetupModalProps {
  isOpen: boolean;
  onSubmit: (discordUsername: string) => void;
  loading?: boolean;
  error?: string;
}

export function DiscordSetupModal({ isOpen, onSubmit, loading = false, error }: DiscordSetupModalProps) {
  const [discordUsername, setDiscordUsername] = useState('');
  const [validationError, setValidationError] = useState('');

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const validateUsername = (username: string): boolean => {
    if (!username || username.trim().length === 0) {
      setValidationError('Discord ID обов\'язковий');
      return false;
    }

    if (username.trim().length < 2) {
      setValidationError('Discord ID має містити мінімум 2 символи');
      return false;
    }

    if (username.trim().length > 32) {
      setValidationError('Discord ID має містити максимум 32 символи');
      return false;
    }

    const validPattern = /^[a-z0-9._]+$/;
    if (!validPattern.test(username.trim().toLowerCase())) {
      setValidationError('Discord ID може містити лише літери, цифри, крапки та підкреслення');
      return false;
    }

    setValidationError('');
    return true;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (validateUsername(discordUsername)) {
      onSubmit(discordUsername.trim().toLowerCase());
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setDiscordUsername(value);

    if (validationError) {
      validateUsername(value);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black bg-opacity-90 backdrop-blur-sm" />

      <div className="relative bg-gray-900 rounded-lg border-2 border-red-600 shadow-2xl w-full max-w-lg">
        <div className="bg-gradient-to-r from-red-600 to-red-700 px-6 py-4">
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Hash className="w-6 h-6" />
            Налаштування Discord ID
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="bg-gray-800 bg-opacity-60 border border-gray-700 rounded-lg p-4 mb-6">
            <p className="text-gray-300 mb-3">
              Для завершення реєстрації потрібно вказати ваш Discord ID (username).
            </p>
            <p className="text-sm text-gray-400 mb-2">
              Де знайти Discord ID:
            </p>
            <ul className="text-sm text-gray-400 list-disc list-inside space-y-1">
              <li>Відкрийте додаток Discord</li>
              <li>Ваш Discord ID знаходиться під вашим ім'ям користувача</li>
              <li>Наприклад: <span className="text-red-400 font-mono">username</span> або <span className="text-red-400 font-mono">user.name</span></li>
            </ul>
          </div>

          <div className="mb-6">
            <label htmlFor="discord-username" className="block text-sm font-medium text-gray-300 mb-2">
              Discord ID (username) *
            </label>
            <div className="relative">
              <input
                id="discord-username"
                type="text"
                value={discordUsername}
                onChange={handleChange}
                placeholder="наприклад: yourname"
                disabled={loading}
                className="w-full bg-gray-800 border border-gray-700 rounded px-4 py-3 text-white focus:border-red-500 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                autoFocus
                required
              />
            </div>
            {validationError && (
              <p className="mt-2 text-sm text-red-400">{validationError}</p>
            )}
            {error && (
              <p className="mt-2 text-sm text-red-400">{error}</p>
            )}
          </div>

          <div className="bg-yellow-950 border border-yellow-700 rounded-lg p-4 mb-6">
            <p className="text-sm text-yellow-200">
              <strong>Важливо:</strong> Вкажіть правильний Discord ID, щоб адміністрація могла зв'язатися з вами.
            </p>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={loading || !discordUsername.trim()}
              className="w-full px-6 py-3 rounded font-semibold bg-red-600 hover:bg-red-500 disabled:bg-gray-700 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Збереження...
                </>
              ) : (
                'Зберегти та продовжити'
              )}
            </button>
          </div>

          <p className="text-xs text-gray-500 text-center mt-4">
            Без Discord ID ви не зможете користуватися кабінетом
          </p>
        </form>
      </div>
    </div>
  );
}
