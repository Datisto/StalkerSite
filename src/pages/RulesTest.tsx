import { useTranslation } from '../hooks/useTranslation';
import LanguageSwitcher from '../components/LanguageSwitcher';
import { useLanguage } from '../contexts/language';
import { localizedText } from '../i18n/content';
import type { Language } from '../i18n/menu';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ArrowLeft, Send, BookOpen, AlertCircle } from 'lucide-react';
import { showAlert, showConfirm } from '../utils/modals';

interface Question {
  id: string;
  question_text: string;
  question_text_en?: string | null;
  is_active?: boolean;
}

interface TestSubmissionStatus {
  approved: boolean | null;
  reviewed_at: string | null;
}

export default function RulesTest() {
  const tx = useTranslation();
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<{ [key: number]: string }>({});
  const [discordId, setDiscordId] = useState('');
  const [testStarted, setTestStarted] = useState(false);
  const [testLanguage, setTestLanguage] = useState<Language>('uk');
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user && user.discord_username) {
      setDiscordId(user.discord_username);
    }
  }, [user]);

  async function startTest() {
    if (!user) {
      await showAlert(tx("Увійдіть через Steam для проходження тесту"), tx("Попередження"), 'warning');
      navigate('/');
      return;
    }

    setLoading(true);
    try {
      const userResponse = await fetch(`/api/users/${user.steam_id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user?.token || ''}`,
        },
      });

      if (!userResponse.ok) {
        throw new Error('Failed to fetch user data');
      }

      const userData = await userResponse.json();

      if (userData?.rules_passed) {
        await showAlert(tx("Ви вже здали тест правил!"), tx("Інформація"), 'info');
        navigate('/cabinet');
        return;
      }

      const submissionsResponse = await fetch(`/api/test-submissions?steam_id=${user.steam_id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user?.token || ''}`,
        },
      });

      if (!submissionsResponse.ok) {
        throw new Error('Failed to fetch submissions');
      }

      const submissions = (await submissionsResponse.json()) as TestSubmissionStatus[];
      const pendingSubmissions = Array.isArray(submissions)
        ? submissions.filter((submission) => submission.approved === null && submission.reviewed_at === null)
        : [];

      if (pendingSubmissions.length > 0) {
        await showAlert(tx("У вас вже є здача правил на розгляді. Дочекайтесь результату перед новою спробою."), tx("Попередження"), 'warning');
        return;
      }

      const questionsResponse = await fetch('/api/questions/', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!questionsResponse.ok) {
        throw new Error('Failed to fetch questions');
      }

      const allQuestions = (await questionsResponse.json()) as Question[];
      const activeQuestions = Array.isArray(allQuestions)
        ? allQuestions.filter((question) => question.is_active)
        : [];

      if (!activeQuestions || activeQuestions.length < 15) {
        await showAlert(tx("Недостатньо питань для проходження тесту. Зверніться до адміністрації."), tx("Помилка"), 'error');
        return;
      }

      const shuffled = activeQuestions.sort(() => Math.random() - 0.5).slice(0, 15);
      setQuestions(shuffled.map((question) => ({
        ...question,
        question_text: localizedText(question.question_text, question.question_text_en, language),
      })));
      setTestLanguage(language);
      setTestStarted(true);
    } catch (error) {
      console.error('Error starting test:', error);
      await showAlert(tx("Помилка при завантаженні тесту"), tx("Помилка"), 'error');
    } finally {
      setLoading(false);
    }
  }

  async function submitTest() {
    if (!discordId.trim()) {
      await showAlert(tx("Введіть ваш Discord ID"), tx("Помилка"), 'warning');
      return;
    }

    const unanswered = questions.findIndex((_, i) => !answers[i]?.trim());
    if (unanswered !== -1) {
      await showAlert(tx("Відповідь на питання {0} відсутня. Заповніть всі питання.", [unanswered + 1]), tx("Помилка"), 'warning');
      return;
    }

    const confirmed = await showConfirm(
      tx("Ви впевнені, що хочете відправити відповіді? Після відправки змінити їх буде неможливо."),
      tx("Підтвердження відправки"),
      { type: 'warning', confirmText: tx("Відправити"), cancelText: tx("Скасувати") }
    );
    if (!confirmed) return;

    setSubmitting(true);
    try {
      const timestamp = new Date().toISOString();
      const testData = {
        timestamp,
        language: testLanguage,
        steam_id: user?.steam_id || '',
        discord_id: discordId,
        questions_and_answers: questions.map((q, i) => ({
          question: q.question_text,
          answer: answers[i] || '',
        })),
      };

      const dbResponse = await fetch('/api/test-submissions/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user?.token || ''}`,
        },
        body: JSON.stringify({
          user_id: user?.id,
          steam_id: user?.steam_id,
          language: testLanguage,
          discord_id: discordId,
          questions: questions.map((q) => q.question_text),
          answers: questions.map((_, i) => answers[i] || ''),
          submitted_at: timestamp,
        }),
      });

      if (!dbResponse.ok) {
        const errorData = await dbResponse.json();
        throw new Error(errorData.message || 'Failed to submit test');
      }

      try {
        const webhookUrl = import.meta.env.VITE_GOOGLE_SHEETS_WEBHOOK_URL;
        if (webhookUrl) {
          await fetch(webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(testData),
          });
        }
      } catch (webhookError) {
        console.error('Google Sheets webhook error:', webhookError);
      }

      try {
        const discordWebhookUrl = import.meta.env.VITE_DISCORD_WEBHOOK_URL;
        if (discordWebhookUrl) {
          await fetch(discordWebhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              embeds: [
                {
                  title: '📝 Нова здача правил',
                  color: 15158332,
                  fields: [
                    {
                      name: 'Мова тесту',
                      value: testLanguage === 'en' ? 'EN' : 'UA',
                      inline: true,
                    },
                    {
                      name: 'Steam ID',
                      value: user?.steam_id || 'Невідомо',
                      inline: true,
                    },
                    {
                      name: 'Discord ID',
                      value: discordId,
                      inline: true,
                    },
                    {
                      name: 'Дата',
                      value: new Date().toLocaleString('uk-UA'),
                      inline: false,
                    },
                  ],
                  timestamp: new Date().toISOString(),
                },
              ],
            }),
          });
        }
      } catch (discordError) {
        console.error('Discord webhook error:', discordError);
      }

      await showAlert(
        tx("Відповіді успішно відправлено!\n\nАдміністрація розгляне ваші відповіді найближчим часом."),
        tx("Успіх"),
        'success'
      );
      navigate('/cabinet');
    } catch (error) {
      console.error('Error submitting test:', error);
      await showAlert(tx("Помилка відправки відповідей. Спробуйте ще раз."), tx("Помилка"), 'error');
    } finally {
      setSubmitting(false);
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-black text-gray-100 flex items-center justify-center p-4">
        <div className="bg-gray-800 bg-opacity-60 p-8 rounded-lg border border-gray-700 max-w-md w-full text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-4">{tx("Потрібна авторизація")}</h2>
          <p className="text-gray-300 mb-6">
            {tx("Для здачі тесту на правила необхідно увійти через Steam")}</p>
          <a
            href="/"
            className="inline-block bg-red-600 hover:bg-red-500 px-6 py-3 rounded font-semibold transition"
          >
            {t('returnHome')}
          </a>
        </div>
      </div>
    );
  }

  if (!testStarted) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-black text-gray-100">
        <header className="border-b border-gray-700 bg-black bg-opacity-60 backdrop-blur-sm">
          <div className="container mx-auto flex flex-wrap items-center justify-between gap-4 px-4 py-4">
            <button
              onClick={() => navigate('/')}
              className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition"
            >
              <ArrowLeft className="w-5 h-5" />
              {t('goHome')}
            </button>
            <LanguageSwitcher />
          </div>
        </header>

        <div className="container mx-auto px-4 py-12 max-w-4xl">
          <div className="bg-gray-800 bg-opacity-60 p-8 rounded-lg border border-gray-700">
            <div className="flex items-center gap-3 mb-6">
              <BookOpen className="w-10 h-10 text-red-500" />
              <h1 className="text-3xl font-bold">{t('rulesTest')}</h1>
            </div>

            <div className="space-y-4 mb-8">
              <div className="bg-gray-900 bg-opacity-60 p-6 rounded border border-gray-700">
                <h2 className="text-xl font-semibold mb-4 text-red-400">{tx("Умови тесту:")}</h2>
                <ul className="space-y-2 text-gray-300">
                  <li className="flex items-start gap-2">
                    <span className="text-red-500 mt-1">•</span>
                    <span>{tx("Вам буде надано ")}<strong>{tx("15 випадкових питань")}</strong> {tx(" з банку правил")}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-500 mt-1">•</span>
                    <span>
                      {tx("Кожне питання вимагає ")}<strong>{tx("письмової розгорнутої відповіді")}</strong>
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-500 mt-1">•</span>
                    <span>{tx("Відповіді мають бути змістовними та відображати ваше розуміння правил")}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-500 mt-1">•</span>
                    <span>
                      {tx("Після відправки адміністрація перевірить ваші відповіді та повідомить про результат")}</span>
                  </li>
                </ul>
              </div>

              <div className="bg-yellow-900 bg-opacity-30 border border-yellow-700 p-4 rounded flex gap-3">
                <AlertCircle className="w-6 h-6 text-yellow-500 flex-shrink-0 mt-0.5" />
                <div className="text-yellow-200 text-sm">
                  <p className="font-semibold mb-1">{tx("Важливо:")}</p>
                  <p>
                    {tx("Перед початком тесту переконайтеся, що ви уважно прочитали всі правила сервера. Тест не обмежений за часом, але після відправки змінити відповіді буде неможливо.")}</p>
                </div>
              </div>
            </div>

            <button
              onClick={startTest}
              disabled={loading}
              className="w-full bg-red-600 hover:bg-red-500 py-4 rounded-lg font-semibold text-lg transition disabled:opacity-50"
            >
              {loading ? t('loading') : t('startTest')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-black text-gray-100">
      <header className="border-b border-gray-700 bg-black bg-opacity-60 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <BookOpen className="w-6 h-6 text-red-500" />
              <h1 className="text-xl font-bold">{t('testTitle')}</h1>
            </div>
            <div className="text-sm text-gray-400">
              <p>{t('testLanguage')}: {testLanguage === 'en' ? 'EN' : 'UA'}</p>
              {tx("Питань: ")}{questions.length} {tx(" | Заповнено: ")}{Object.keys(answers).filter((k) => answers[parseInt(k)]?.trim()).length}/{questions.length}
            </div>
            <LanguageSwitcher />
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="bg-gray-800 bg-opacity-60 p-6 rounded-lg border border-gray-700 mb-6">
          <h2 className="text-lg font-semibold mb-4">{tx("Ваші дані")}</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-2">Steam ID</label>
              <input
                type="text"
                value={user?.steam_id || ''}
                disabled
                className="w-full bg-gray-900 border border-gray-700 rounded px-4 py-2 text-gray-400"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">Discord ID</label>
              <input
                type="text"
                value={discordId}
                disabled
                className="w-full bg-gray-900 border border-gray-700 rounded px-4 py-2 text-gray-400"
              />
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {questions.map((question, index) => (
            <div
              key={question.id}
              className="bg-gray-800 bg-opacity-60 p-6 rounded-lg border border-gray-700"
            >
              <div className="flex items-start gap-3 mb-4">
                <div className="bg-red-600 text-white font-bold rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0">
                  {index + 1}
                </div>
                <h3 className="text-lg font-semibold flex-1">{question.question_text}</h3>
              </div>

              <textarea
                value={answers[index] || ''}
                onChange={(e) => setAnswers({ ...answers, [index]: e.target.value })}
                rows={6}
                placeholder={tx("Введіть вашу відповідь... (розгорнута відповідь)")}
                className="w-full bg-gray-900 border border-gray-700 rounded px-4 py-3 focus:outline-none focus:border-red-500 resize-none"
              />

              {answers[index]?.trim() && (
                <p className="text-xs text-gray-500 mt-2">
                  {tx("Символів: ")}{answers[index].length}
                </p>
              )}
            </div>
          ))}
        </div>

        <div className="mt-8 bg-gray-800 bg-opacity-60 p-6 rounded-lg border border-gray-700">
          <h3 className="text-lg font-semibold mb-4">{tx("Готові відправити?")}</h3>
          <p className="text-gray-400 mb-6">
            {tx("Переконайтеся, що ви відповіли на всі питання та перевірили свій Discord ID. Після відправки змінити відповіді буде неможливо.")}</p>

          <button
            onClick={submitTest}
            disabled={submitting}
            className="w-full inline-flex items-center justify-center gap-2 bg-green-600 hover:bg-green-500 py-4 rounded-lg font-semibold text-lg transition disabled:opacity-50"
          >
            <Send className="w-5 h-5" />
            {submitting ? t('sending') : t('submitAnswers')}
          </button>
        </div>
      </div>
    </div>
  );
}
