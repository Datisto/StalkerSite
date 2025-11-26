import { Skull, Users, Shield, BookOpen } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function LandingPage() {
  const { user } = useAuth();

  const handleSteamLogin = () => {
    console.log('Steam login');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-black text-gray-100">
      <div
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage: 'url(https://images.pexels.com/photos/2444429/pexels-photo-2444429.jpeg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed'
        }}
      />

      <div className="relative">
        <header className="border-b border-gray-700 bg-black bg-opacity-60 backdrop-blur-sm">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Skull className="w-8 h-8 text-red-500" />
                <div>
                  <h1 className="text-2xl font-bold tracking-wider">STALKER RP</h1>
                  <p className="text-xs text-gray-400">DayZ Standalone</p>
                </div>
              </div>

              <nav className="hidden md:flex items-center gap-6">
                <a href="#about" className="text-gray-300 hover:text-white transition">Про сервер</a>
                <a href="#rules" className="text-gray-300 hover:text-white transition">Правила</a>
                <a href="#factions" className="text-gray-300 hover:text-white transition">Фракції</a>
                <a href="#discord" className="text-gray-300 hover:text-white transition">Discord</a>
              </nav>

              {!user ? (
                <button
                  onClick={handleSteamLogin}
                  className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 px-6 py-2 rounded font-semibold transition shadow-lg"
                >
                  Увійти через Steam
                </button>
              ) : (
                <div className="flex items-center gap-4">
                  <span className="text-sm text-gray-300">{user.steam_nickname}</span>
                  <a
                    href="/cabinet"
                    className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded transition"
                  >
                    Кабінет
                  </a>
                </div>
              )}
            </div>
          </div>
        </header>

        <section className="py-20 px-4">
          <div className="container mx-auto text-center">
            <h2 className="text-5xl md:text-6xl font-bold mb-6 tracking-wide">
              Ласкаво просимо до <span className="text-red-500">Зони</span>
            </h2>
            <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
              Унікальний roleplay сервер по всесвіту S.T.A.L.K.E.R. на платформі DayZ Standalone
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={handleSteamLogin}
                className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 px-8 py-3 rounded-lg text-lg font-semibold transition shadow-xl"
              >
                Розпочати подорож
              </button>
              <a
                href="#about"
                className="bg-gray-700 hover:bg-gray-600 px-8 py-3 rounded-lg text-lg font-semibold transition"
              >
                Дізнатись більше
              </a>
            </div>
          </div>
        </section>

        <section id="about" className="py-16 px-4 bg-gray-900 bg-opacity-80">
          <div className="container mx-auto">
            <h3 className="text-3xl font-bold mb-12 text-center">Чому варто приєднатись?</h3>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="bg-gray-800 bg-opacity-60 p-6 rounded-lg border border-gray-700 hover:border-red-500 transition">
                <Users className="w-12 h-12 text-red-500 mb-4" />
                <h4 className="text-xl font-semibold mb-3">Активна спільнота</h4>
                <p className="text-gray-400">
                  Понад 500+ гравців щодня створюють унікальні історії в Зоні. Кожен персонаж - це окрема доля з власною біографією.
                </p>
              </div>

              <div className="bg-gray-800 bg-opacity-60 p-6 rounded-lg border border-gray-700 hover:border-red-500 transition">
                <Shield className="w-12 h-12 text-red-500 mb-4" />
                <h4 className="text-xl font-semibold mb-3">Якісна модерація</h4>
                <p className="text-gray-400">
                  Команда досвідчених адміністраторів забезпечує дотримання правил та атмосферу справжнього roleplay.
                </p>
              </div>

              <div className="bg-gray-800 bg-opacity-60 p-6 rounded-lg border border-gray-700 hover:border-red-500 transition">
                <BookOpen className="w-12 h-12 text-red-500 mb-4" />
                <h4 className="text-xl font-semibold mb-3">Глибокий лор</h4>
                <p className="text-gray-400">
                  Детально пропрацьований світ, фракції, економіка та політика. Ваші дії впливають на долю всієї Зони.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section id="rules" className="py-16 px-4">
          <div className="container mx-auto max-w-4xl">
            <h3 className="text-3xl font-bold mb-8 text-center">Основні правила</h3>
            <div className="bg-gray-800 bg-opacity-60 p-8 rounded-lg border border-gray-700">
              <ol className="space-y-4 text-gray-300">
                <li className="flex gap-3">
                  <span className="text-red-500 font-bold">1.</span>
                  <div>
                    <strong>Roleplay понад усе.</strong> Всі дії повинні бути обґрунтовані з точки зору вашого персонажа.
                  </div>
                </li>
                <li className="flex gap-3">
                  <span className="text-red-500 font-bold">2.</span>
                  <div>
                    <strong>Заборонено RDM.</strong> Вбивство без roleplay причини карається баном.
                  </div>
                </li>
                <li className="flex gap-3">
                  <span className="text-red-500 font-bold">3.</span>
                  <div>
                    <strong>Цінуйте життя персонажа.</strong> Fear RP обов'язковий - ваш герой боїться смерті.
                  </div>
                </li>
                <li className="flex gap-3">
                  <span className="text-red-500 font-bold">4.</span>
                  <div>
                    <strong>Метагейминг заборонено.</strong> Використання інформації поза грою - порушення.
                  </div>
                </li>
                <li className="flex gap-3">
                  <span className="text-red-500 font-bold">5.</span>
                  <div>
                    <strong>Повага до інших.</strong> Токсична поведінка та образи неприпустимі.
                  </div>
                </li>
              </ol>
              <div className="mt-8 text-center">
                <a
                  href="#"
                  className="inline-block bg-red-600 hover:bg-red-500 px-6 py-2 rounded font-semibold transition"
                >
                  Повні правила
                </a>
              </div>
            </div>
          </div>
        </section>

        <section id="factions" className="py-16 px-4 bg-gray-900 bg-opacity-80">
          <div className="container mx-auto">
            <h3 className="text-3xl font-bold mb-12 text-center">Фракції Зони</h3>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-gray-800 bg-opacity-60 p-6 rounded-lg border border-gray-700 hover:border-green-500 transition">
                <h4 className="text-xl font-semibold mb-2 text-green-400">Вільні сталкери</h4>
                <p className="text-gray-400 text-sm">
                  Незалежні мисливці за артефактами. Свобода та особиста вигода понад усе.
                </p>
              </div>

              <div className="bg-gray-800 bg-opacity-60 p-6 rounded-lg border border-gray-700 hover:border-blue-500 transition">
                <h4 className="text-xl font-semibold mb-2 text-blue-400">Свобода</h4>
                <p className="text-gray-400 text-sm">
                  Анархісти, що виступають за вільний доступ до Зони для всіх бажаючих.
                </p>
              </div>

              <div className="bg-gray-800 bg-opacity-60 p-6 rounded-lg border border-gray-700 hover:border-red-500 transition">
                <h4 className="text-xl font-semibold mb-2 text-red-400">Duty</h4>
                <p className="text-gray-400 text-sm">
                  Військова організація, що прагне знищити Зону та захистити зовнішній світ.
                </p>
              </div>

              <div className="bg-gray-800 bg-opacity-60 p-6 rounded-lg border border-gray-700 hover:border-yellow-500 transition">
                <h4 className="text-xl font-semibold mb-2 text-yellow-400">Торгівці</h4>
                <p className="text-gray-400 text-sm">
                  Нейтральні постачальники, що забезпечують сталкерів необхідним спорядженням.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section id="discord" className="py-16 px-4">
          <div className="container mx-auto text-center max-w-2xl">
            <h3 className="text-3xl font-bold mb-6">Приєднуйся до спільноти</h3>
            <p className="text-gray-300 mb-8">
              Наш Discord сервер - це місце, де ти можеш знайти напарників, дізнатись останні новини та отримати підтримку.
            </p>
            <a
              href="#"
              className="inline-block bg-indigo-600 hover:bg-indigo-500 px-8 py-3 rounded-lg text-lg font-semibold transition shadow-xl"
            >
              Приєднатись до Discord
            </a>
          </div>
        </section>

        <footer className="py-8 px-4 border-t border-gray-700 bg-black bg-opacity-60">
          <div className="container mx-auto text-center text-gray-400 text-sm">
            <p>&copy; 2025 STALKER RP. Усі права захищені.</p>
            <p className="mt-2">
              DayZ Standalone Roleplay Server. Не афілійований з GSC Game World або Bohemia Interactive.
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}
