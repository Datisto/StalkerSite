import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Skull, Users, Shield, BookOpen, Play, Map, map-pin-pen } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function LandingPage() {
  const { user } = useAuth();
  const [showManualLogin, setShowManualLogin] = useState(false);
  const [steamId, setSteamId] = useState('');
  const [steamName, setSteamName] = useState('');

  const handleSteamLogin = () => {
    const returnUrl = `${window.location.origin}/steam-callback`;
    const functionUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/steam-auth`;
    window.location.href = `${functionUrl}?mode=login&return_url=${encodeURIComponent(returnUrl)}`;
  };

  const handleManualLogin = () => {
    if (!steamId.trim() || !steamName.trim()) {
      alert('Заповніть всі поля');
      return;
    }
    window.location.href = `/steam-callback?steamid=${steamId}&steamname=${encodeURIComponent(steamName)}`;
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
                <Link to="/rules-test" className="text-gray-300 hover:text-white transition">Здача правил</Link>
                <a href="#discord" className="text-gray-300 hover:text-white transition">Discord</a>
              </nav>

              {!user ? (
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowManualLogin(!showManualLogin)}
                    className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded font-semibold transition"
                  >
                    Тест вхід
                  </button>
                  <button
                    onClick={handleSteamLogin}
                    className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 px-6 py-2 rounded font-semibold transition shadow-lg"
                  >
                    Увійти через Steam
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-4">
                  <span className="text-sm text-gray-300">{user.steam_nickname}</span>
                  <Link
                    to="/cabinet"
                    className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded transition"
                  >
                    Кабінет
                  </Link>
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
              {!user ? (
                <button
                  onClick={handleSteamLogin}
                  className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 px-8 py-3 rounded-lg text-lg font-semibold transition shadow-xl"
                >
                  Розпочати подорож
                </button>
              ) : (
                <Link
                  to="/cabinet"
                  className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 px-8 py-3 rounded-lg text-lg font-semibold transition shadow-xl"
                >
                  Кабінет гравця
                </Link>
              )}
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
                <Play className="w-12 h-12 text-red-500 mb-4" />
                <h4 className="text-xl font-semibold mb-3">Як почати грати</h4>
                <p className="text-gray-400">
                  Щоб одразу стати частиною нашого ком’юніті та розпочати гру, потрібно виконати кілька простих кроків:<br />

- Прочитати правила сервера.<br />

- Зайти в наш Discord.<br />

- На сайті заповнити форму здачі правил.<br />

- Дочекатися, поки вас тегнуть у Discord для підтвердження, що заявку прийнято.<br />

- Зайти у свій особистий кабінет на сайті та створити свого персонажа.<br />

- Дочекатися схвалення персонажа — про це ви також будете повідомлені.<br /><br />

Увесь час, поки ви очікуєте підтвердження, ви можете вільно заходити в гру та вивчати нашу Малу Зону. Це дозволить швидко адаптуватися, зрозуміти механіки та відчути атмосферу сервера.
                </p>
              </div>

<div className="bg-gray-800 bg-opacity-60 p-6 rounded-lg border border-gray-700 hover:border-red-500 transition">
                <Map className="w-12 h-12 text-red-500 mb-4" />
                <h4 className="text-xl font-semibold mb-3">Мала ЗОНА</h4>
                <p className="text-gray-400">
                  У нас своя мала зона — місце, куди потрапляють усі хто хоче спробувати складне виживання в сталкер рп без заморочок.<br /><br />
Туди попадають:<br />

- ті, хтоне пам’ятає, як туди потрапив,<br />

- ті кого забула сама ЗОНА,<br />

- або ті, хто просто хоче спробувати гру без створення персонажа.<br />
<br />
Тут ти можеш:<br />

- Опробувати механіки серверу,<br />

- познайомитись з тим що таке РП,<br />

- відчути атмосферу,<br />

- зрозуміти, чи подобається тобі цей світ.<br />
<br />
І все це без здачі правил і без створення персонажа.<br />
Це наш спосіб дати тобі шанс увійти в атмосферу, перш ніж стати частиною історії.
                </p>
              </div>
              
              <div className="bg-gray-800 bg-opacity-60 p-6 rounded-lg border border-gray-700 hover:border-red-500 transition">
                <Shield className="w-12 h-12 text-red-500 mb-4" />
                <h4 className="text-xl font-semibold mb-3">Унікальні моди, створені вручну</h4>
                <p className="text-gray-400">
                  Усі ключові модифікації — це наша власна робота, наш стиль і бачення Зони.

          Тут перероблено або створено з нуля:<br />
            - система чищення та обслуговування зброї,<br />
            - глибоке приготування їжі,<br />
            - медична система за авторством Терджу,<br />
            - повноцінний артхантинг, а не «збір грибів»,<br />
            - мисливські механіки,<br />
            - жива та складна економіка,<br />
            - десятки дрібних, але важливих механік,<br />
           які роблять виживання логічним, а РП — глибоким.<br />

<br />

Кожен мод — це роздуми, тести, робота руками й серцем.
                </p>
              </div>

              <div className="bg-gray-800 bg-opacity-60 p-6 rounded-lg border border-gray-700 hover:border-red-500 transition">
                <Users className="w-12 h-12 text-red-500 mb-4" />
                <h4 className="text-xl font-semibold mb-3">Від фанатів — для фанатів</h4>
                <p className="text-gray-400">
                  Цей проєкт створений людьми, які жили сталкерською атмосферою задовго до появи DayZ.<br />
Наша команда — це старі фанати серії S.T.A.L.K.E.R., які перенесли у Зону:<br />

- любов до деталей,<br />

- повагу до первісної атмосфери,<br />

- ідею реалістичного виживання.<br />
<br />
Ми не робимо "просто сервер" — ми створюємо місце, де S.T.A.L.K.E.R. оживає таким, яким мав бути.
                </p>
              </div>

              <div className="bg-gray-800 bg-opacity-60 p-6 rounded-lg border border-gray-700 hover:border-red-500 transition">
                <BookOpen className="w-12 h-12 text-red-500 mb-4" />
                <h4 className="text-xl font-semibold mb-3">Атмосфера Того самого Салкеру</h4>
                <p className="text-gray-400">
                  У нашій Зоні ти не герой і не суперсолдат.<br />
Ти — маленька людина, яка намагається вижити там, де світ тебе не помічає.<br />

Тут:<br />

- ти боїшся ночі, бо чуєш те, чого краще не чути;<br />

- ти відчуваєш ціну кожного патрона;<br />

- ти думаєш, перш ніж стріляти;<br />

- ти цінуєш кожен ковток чистої води;<br />

- ти розумієш, що бути сталкером — це не пафос, а робота, страх і боротьба.<br />
<br />
Атмосфера — не декорація.<br />
Вона змушує тебе жити у Зоні, а не пробігати її, як черговий квест.
                </p>
              </div>

              <div className="bg-gray-800 bg-opacity-60 p-6 rounded-lg border border-gray-700 hover:border-red-500 transition">
                <Map-pin-pen className="w-12 h-12 text-red-500 mb-4" />
                <h4 className="text-xl font-semibold mb-3">Свій власний ЛОР, що формується гравцями</h4>
                <p className="text-gray-400">
                  Лор сервера розвивається з моменту його відкриття у 2023 році<br /> та безпосередньо базується на діях гравців.<br /><br />
У внутрішньому світі проєкту Сама Зона існує з 2006 року,<br /> а перші сталкери почали активно проникати через периметр у 2010,<br /> закладаючи основу для розвитку подій, угруповань,<br /> конфліктів і загальної історії серверу.<br />

Тут саме гравці формують Зону:<br />
кожен вибір,<br /> кожен дія,<br /> кожна угода чи конфлікт<br /> — усе має наслідки та впливає на те,<br /> яким буде сюжет і атмосфера вашого світу.
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
            <div className="mb-4 flex justify-center gap-6">
              <Link to="/rules-test" className="hover:text-white transition">Здача правил</Link>
              <Link to="/admin/login" className="hover:text-white transition">Адмін-панель</Link>
            </div>
            <p>&copy; 2025 STALKER RP. Усі права захищені.</p>
            <p className="mt-2">
              DayZ Standalone Roleplay Server. Не афілійований з GSC Game World або Bohemia Interactive.
            </p>
          </div>
        </footer>
      </div>

      {showManualLogin && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full border border-gray-700">
            <h2 className="text-2xl font-bold mb-4">Тестовий вхід</h2>
            <p className="text-gray-400 text-sm mb-4">
              Тимчасова форма для тестування. Введіть будь-які дані.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Steam ID</label>
                <input
                  type="text"
                  value={steamId}
                  onChange={(e) => setSteamId(e.target.value)}
                  placeholder="76561198000000000"
                  className="w-full bg-gray-900 border border-gray-700 rounded px-4 py-2 focus:outline-none focus:border-red-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Steam нікнейм</label>
                <input
                  type="text"
                  value={steamName}
                  onChange={(e) => setSteamName(e.target.value)}
                  placeholder="TestPlayer"
                  className="w-full bg-gray-900 border border-gray-700 rounded px-4 py-2 focus:outline-none focus:border-red-500"
                />
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <button
                onClick={() => setShowManualLogin(false)}
                className="flex-1 bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded transition"
              >
                Скасувати
              </button>
              <button
                onClick={handleManualLogin}
                className="flex-1 bg-red-600 hover:bg-red-500 px-4 py-2 rounded transition"
              >
                Увійти
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
