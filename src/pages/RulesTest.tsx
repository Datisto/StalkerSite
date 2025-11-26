import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { CheckCircle, XCircle, Clock, BookOpen } from 'lucide-react';

interface Question {
  id: string;
  question_text: string;
  correct_answer: string;
  incorrect_answers: string[];
}

interface TestAttempt {
  id: string;
  score: number;
  passed: boolean;
  completed_at: string;
}

export default function RulesTest() {
  const { user } = useAuth();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<{ [key: number]: string }>({});
  const [testStarted, setTestStarted] = useState(false);
  const [testCompleted, setTestCompleted] = useState(false);
  const [results, setResults] = useState<{ score: number; passed: boolean } | null>(null);
  const [previousAttempts, setPreviousAttempts] = useState<TestAttempt[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadPreviousAttempts();
    }
  }, [user]);

  async function loadPreviousAttempts() {
    try {
      const { data, error } = await supabase
        .from('rules_test_attempts')
        .select('id, score, passed, completed_at')
        .eq('user_id', user!.id)
        .order('completed_at', { ascending: false })
        .limit(5);

      if (error) throw error;
      setPreviousAttempts(data || []);
    } catch (error) {
      console.error('Error loading attempts:', error);
    } finally {
      setLoading(false);
    }
  }

  async function startTest() {
    try {
      const { data, error } = await supabase
        .from('rules_questions')
        .select('id, question_text, correct_answer, incorrect_answers')
        .eq('is_active', true)
        .limit(20);

      if (error) throw error;

      if (!data || data.length < 10) {
        alert('Недостатньо питань для проходження тесту');
        return;
      }

      const shuffled = data.sort(() => Math.random() - 0.5).slice(0, 15);
      setQuestions(shuffled);
      setTestStarted(true);
    } catch (error) {
      console.error('Error starting test:', error);
      alert('Помилка при завантаженні тесту');
    }
  }

  function getShuffledAnswers(question: Question) {
    const allAnswers = [
      question.correct_answer,
      ...(Array.isArray(question.incorrect_answers)
        ? question.incorrect_answers
        : [])
    ];
    return allAnswers.sort(() => Math.random() - 0.5);
  }

  function selectAnswer(answer: string) {
    setAnswers({ ...answers, [currentQuestion]: answer });
  }

  function nextQuestion() {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    }
  }

  function previousQuestion() {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  }

  async function submitTest() {
    let correctCount = 0;
    const detailedAnswers = questions.map((q, i) => {
      const userAnswer = answers[i];
      const isCorrect = userAnswer === q.correct_answer;
      if (isCorrect) correctCount++;

      return {
        question: q.question_text,
        user_answer: userAnswer,
        correct_answer: q.correct_answer,
        is_correct: isCorrect
      };
    });

    const score = Math.round((correctCount / questions.length) * 100);
    const passed = score >= 80;

    try {
      const { error } = await supabase
        .from('rules_test_attempts')
        .insert({
          user_id: user!.id,
          score,
          total_questions: questions.length,
          correct_answers: correctCount,
          passed,
          answers: detailedAnswers,
          completed_at: new Date().toISOString()
        });

      if (error) throw error;

      setResults({ score, passed });
      setTestCompleted(true);
      await loadPreviousAttempts();
    } catch (error) {
      console.error('Error submitting test:', error);
      alert('Помилка при збереженні результатів');
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-300 mb-4">Будь ласка, увійдіть через Steam</p>
          <a href="/" className="bg-red-600 hover:bg-red-500 px-6 py-2 rounded font-semibold transition">
            На головну
          </a>
        </div>
      </div>
    );
  }

  if (testCompleted && results) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-black text-gray-100">
        <header className="border-b border-gray-700 bg-black bg-opacity-60 backdrop-blur-sm">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <a href="/" className="text-xl font-bold">STALKER RP</a>
              <a href="/cabinet" className="text-sm text-gray-400 hover:text-white transition">
                До кабінету
              </a>
            </div>
          </div>
        </header>

        <div className="container mx-auto px-4 py-16 max-w-2xl text-center">
          {results.passed ? (
            <div>
              <CheckCircle className="w-24 h-24 text-green-500 mx-auto mb-6" />
              <h1 className="text-4xl font-bold mb-4 text-green-500">Тест пройдено!</h1>
              <p className="text-xl text-gray-300 mb-2">
                Ваш результат: <strong>{results.score}%</strong>
              </p>
              <p className="text-gray-400 mb-8">
                Вітаємо! Ви успішно склали тест на знання правил сервера.
              </p>
            </div>
          ) : (
            <div>
              <XCircle className="w-24 h-24 text-red-500 mx-auto mb-6" />
              <h1 className="text-4xl font-bold mb-4 text-red-500">Тест не пройдено</h1>
              <p className="text-xl text-gray-300 mb-2">
                Ваш результат: <strong>{results.score}%</strong>
              </p>
              <p className="text-gray-400 mb-8">
                Для проходження потрібно набрати мінімум 80%. Будь ласка, ознайомтесь з правилами та спробуйте знову.
              </p>
            </div>
          )}

          <div className="flex gap-4 justify-center">
            <a
              href="/cabinet"
              className="bg-gray-700 hover:bg-gray-600 px-6 py-3 rounded-lg font-semibold transition"
            >
              До кабінету
            </a>
            {!results.passed && (
              <button
                onClick={() => {
                  setTestStarted(false);
                  setTestCompleted(false);
                  setResults(null);
                  setAnswers({});
                  setCurrentQuestion(0);
                }}
                className="bg-red-600 hover:bg-red-500 px-6 py-3 rounded-lg font-semibold transition"
              >
                Пройти ще раз
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (testStarted && questions.length > 0) {
    const currentQ = questions[currentQuestion];
    const progress = ((currentQuestion + 1) / questions.length) * 100;

    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-black text-gray-100">
        <header className="border-b border-gray-700 bg-black bg-opacity-60 backdrop-blur-sm">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <a href="/" className="text-xl font-bold">STALKER RP</a>
              <div className="text-sm text-gray-400">
                Питання {currentQuestion + 1} з {questions.length}
              </div>
            </div>
          </div>
        </header>

        <div className="container mx-auto px-4 py-8 max-w-3xl">
          <div className="mb-6">
            <div className="bg-gray-700 rounded-full h-2">
              <div
                className="bg-red-600 h-2 rounded-full transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          <div className="bg-gray-800 bg-opacity-60 p-8 rounded-lg border border-gray-700">
            <h2 className="text-2xl font-semibold mb-6">{currentQ.question_text}</h2>

            <div className="space-y-3">
              {getShuffledAnswers(currentQ).map((answer, i) => (
                <button
                  key={i}
                  onClick={() => selectAnswer(answer)}
                  className={`w-full text-left p-4 rounded border-2 transition ${
                    answers[currentQuestion] === answer
                      ? 'border-red-500 bg-red-900 bg-opacity-30'
                      : 'border-gray-700 bg-gray-900 hover:border-gray-600'
                  }`}
                >
                  {answer}
                </button>
              ))}
            </div>

            <div className="mt-8 flex justify-between">
              <button
                onClick={previousQuestion}
                disabled={currentQuestion === 0}
                className="bg-gray-700 hover:bg-gray-600 px-6 py-2 rounded transition disabled:opacity-50"
              >
                Назад
              </button>

              {currentQuestion === questions.length - 1 ? (
                <button
                  onClick={submitTest}
                  disabled={Object.keys(answers).length !== questions.length}
                  className="bg-green-600 hover:bg-green-500 px-6 py-2 rounded font-semibold transition disabled:opacity-50"
                >
                  Завершити тест
                </button>
              ) : (
                <button
                  onClick={nextQuestion}
                  className="bg-red-600 hover:bg-red-500 px-6 py-2 rounded transition"
                >
                  Далі
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-black text-gray-100">
      <header className="border-b border-gray-700 bg-black bg-opacity-60 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <a href="/" className="text-xl font-bold">STALKER RP</a>
            <a href="/cabinet" className="text-sm text-gray-400 hover:text-white transition">
              До кабінету
            </a>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-16 max-w-4xl">
        <div className="text-center mb-12">
          <BookOpen className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-4xl font-bold mb-4">Тест на знання правил</h1>
          <p className="text-xl text-gray-300">
            Перевірте свої знання правил сервера STALKER RP
          </p>
        </div>

        <div className="bg-gray-800 bg-opacity-60 p-8 rounded-lg border border-gray-700 mb-8">
          <h2 className="text-2xl font-semibold mb-6">Умови проходження:</h2>
          <ul className="space-y-3 text-gray-300">
            <li className="flex items-start gap-3">
              <Clock className="w-6 h-6 text-red-500 flex-shrink-0 mt-0.5" />
              <span>Тест складається з 15 випадкових питань</span>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle className="w-6 h-6 text-red-500 flex-shrink-0 mt-0.5" />
              <span>Для проходження потрібно правильно відповісти на 80% питань</span>
            </li>
            <li className="flex items-start gap-3">
              <BookOpen className="w-6 h-6 text-red-500 flex-shrink-0 mt-0.5" />
              <span>Перед проходженням уважно ознайомтесь з правилами сервера</span>
            </li>
          </ul>

          <div className="mt-8 text-center">
            <button
              onClick={startTest}
              className="bg-red-600 hover:bg-red-500 px-8 py-3 rounded-lg text-lg font-semibold transition"
            >
              Розпочати тест
            </button>
          </div>
        </div>

        {previousAttempts.length > 0 && (
          <div className="bg-gray-800 bg-opacity-60 p-6 rounded-lg border border-gray-700">
            <h3 className="text-xl font-semibold mb-4">Попередні спроби</h3>
            <div className="space-y-3">
              {previousAttempts.map((attempt) => (
                <div
                  key={attempt.id}
                  className="flex items-center justify-between bg-gray-900 p-4 rounded border border-gray-700"
                >
                  <div>
                    <p className="font-semibold">
                      Результат: {attempt.score}%
                    </p>
                    <p className="text-sm text-gray-400">
                      {new Date(attempt.completed_at).toLocaleString('uk-UA')}
                    </p>
                  </div>
                  {attempt.passed ? (
                    <CheckCircle className="w-6 h-6 text-green-500" />
                  ) : (
                    <XCircle className="w-6 h-6 text-red-500" />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
