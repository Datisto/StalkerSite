import { useTranslation } from '../hooks/useTranslation';
import { localizedText } from '../i18n/content';
import LanguageSwitcher from '../components/LanguageSwitcher';
import { useLanguage } from '../contexts/language';
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Users, Shield, BookOpen, Play, Map, Kanban } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { apiClient } from '../lib/api-client';
import logoIcon from '../assets/a_7bf503427402fe411e336e01e8f6f15a.webp';

interface MediaVideo {
  id: string;
  title: string;
  title_en?: string | null;
  url: string;
  thumbnail_url: string;
  order_index: number;
  is_published: boolean;
}

function extractYouTubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/,
    /youtube\.com\/embed\/([^&\n?#]+)/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

function extractTwitchId(url: string): string | null {
  const match = url.match(/twitch\.tv\/videos\/(\d+)/);
  return match ? match[1] : null;
}

export default function LandingPage() {
  const tx = useTranslation();
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const [videos, setVideos] = useState<MediaVideo[]>([]);
  const [loadingVideos, setLoadingVideos] = useState(true);

  useEffect(() => {
    loadVideos();
  }, []);

  async function loadVideos() {
    setLoadingVideos(true);
    try {
      const data = await apiClient.get<MediaVideo[]>('/media-videos');
      setVideos(data || []);
    } catch (error) {
      console.error('Error loading videos:', error);
    } finally {
      setLoadingVideos(false);
    }
  }

  const handleSteamLogin = () => {
    const returnUrl = `${window.location.origin}/steam-callback`;
    apiClient.auth.steamLogin(returnUrl);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-black text-gray-100">
      <div
        className="absolute inset-0 opacity-50"
        style={{
          backgroundImage: 'url(https://i.ibb.co/nqgK0f8B/Screenshot-2025-11-30-032706.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed'
        }}
      />

      <div className="relative">
        <header className="border-b border-gray-700 bg-black bg-opacity-98 backdrop-blur-sm">
          <div className="container mx-auto px-4 py-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <img src={logoIcon} alt="Eternal ZONE" className="w-16 h-16 object-contain" />
                <div>
                  <h1 className="text-2xl font-bold tracking-wider font-stalker">Eternal ZONE</h1>
                  <p className="text-xs text-gray-400">S.T.A.L.K.E.R. RP</p>
                </div>
              </div>

              <nav aria-label={t('navigation')} className="order-last flex w-full flex-wrap items-center gap-x-6 gap-y-3 xl:order-none xl:w-auto">
                <a href="#about" className="text-gray-300 hover:text-white transition">{t('about')}</a>
                <a href="#rules" className="text-gray-300 hover:text-white transition">{t('rules')}</a>
                <a href="#media" className="text-gray-300 hover:text-white transition">{t('media')}</a>
                <a href="#faq" className="text-gray-300 hover:text-white transition">{t('faq')}</a>
                <a href="#discord" className="text-gray-300 hover:text-white transition">{t('discord')}</a>
              </nav>

              {!user ? (
                <button
                  onClick={handleSteamLogin}
                  className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 px-6 py-2 rounded font-semibold transition shadow-lg"
                >
                  {t('steamLogin')}
                </button>
              ) : (
                <div className="flex items-center gap-4">
                  <span className="text-sm text-gray-300">{user.steam_nickname}</span>
                  <Link
                    to="/cabinet"
                    className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded transition"
                  >
                    {t('cabinet')}
                  </Link>
                </div>
              )}
              <LanguageSwitcher />
            </div>
          </div>
        </header>

        <section className="py-20 px-4">
          <div className="container mx-auto text-center">
            <h2 className="text-5xl md:text-6xl font-bold mb-6 tracking-wide">
              {t('welcomePrefix')}{' '}<span className="text-red-500">{t('welcomeZone')}</span>
            </h2>
            <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
              {t('serverDescription')}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {!user ? (
                <button
                  onClick={handleSteamLogin}
                  className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 px-8 py-3 rounded-lg text-lg font-semibold transition shadow-xl"
                >
                  {t('startJourney')}
                </button>
              ) : (
                <Link
                  to="/cabinet"
                  className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 px-8 py-3 rounded-lg text-lg font-semibold transition shadow-xl"
                >
                  {t('playerCabinet')}
                </Link>
              )}
              <a
                href="#about"
                className="bg-gray-700 hover:bg-gray-600 px-8 py-3 rounded-lg text-lg font-semibold transition"
              >
                {t('learnMore')}
              </a>
            </div>
          </div>
        </section>

        <section id="about" className="py-16 px-4 bg-gray-900 bg-opacity-80">
          <div className="container mx-auto">
            <h3 className="text-3xl font-bold mb-12 text-center">{t('aboutTitle')}</h3>
            <div className="grid md:grid-cols-3 gap-8">

              <div className="bg-gray-800 bg-opacity-60 p-6 rounded-lg border border-gray-700 hover:border-red-500 transition">
                <Play className="w-12 h-12 text-red-500 mb-4" />
                <h4 className="text-xl font-semibold mb-3">{tx("Як почати грати")}</h4>
                <p className="text-gray-400">
                  {tx("Щоб одразу стати частиною нашого ком’юніті та розпочати гру, потрібно виконати кілька простих кроків:")}<br />

                  {tx("- Прочитати правила сервера.")}<br />

                  {tx("- Зайти в наш Discord.")}<br />

                  {tx("- Зареєструватись на сайті.")}<br />

                  {tx("- На сайті заповнити форму здачі правил.")}<br />

                  {tx("- Дочекатися, поки вас відмітять у Discord для підтвердження, що заявку прийнято.")}<br />

                  {tx("- Зайти у свій особистий кабінет на сайті та створити свого персонажа.")}<br />

                  {tx("- Дочекатися схвалення персонажа — про це ви також будете повідомлені.")}<br /><br />

                  {tx("Увесь час, поки ви очікуєте підтвердження, ви можете вільно заходити в гру та вивчати нашу Малу Зону. Це дозволить швидко адаптуватися, зрозуміти механіки та відчути атмосферу сервера.")}</p>
              </div>

              <div className="bg-gray-800 bg-opacity-60 p-6 rounded-lg border border-gray-700 hover:border-red-500 transition">
                <Map className="w-12 h-12 text-red-500 mb-4" />
                <h4 className="text-xl font-semibold mb-3">{tx("Мала ЗОНА")}</h4>
                <p className="text-gray-400">
                  {tx("У нас своя мала зона — місце, куди потрапляють усі, хто хоче спробувати складне виживання у S.T.A.L.K.E.R. RP без зайвих складнощів.")}<br /><br />
                  {tx("Туди потрапляють:")}<br />

                  {tx("- ті, хто не пам’ятає, як туди потрапив,")}<br />

                  {tx("- ті, кого забула сама Зона,")}<br />

                  {tx("- або ті, хто просто хоче спробувати гру без створення персонажа.")}<br />
                  <br />
                  {tx("Тут ти можеш:")}<br />

                  {tx("- випробувати механіки сервера,")}<br />

                  {tx("- познайомитися з тим, що таке РП,")}<br />

                  {tx("- відчути атмосферу,")}<br />

                  {tx("- зрозуміти, чи подобається тобі цей світ.")}<br />
                  <br />
                  {tx("І все це без здачі правил і без створення персонажа.")}<br />
                  {tx("Це наш спосіб дати тобі шанс увійти в атмосферу, перш ніж стати частиною історії.")}</p>
              </div>

              <div className="bg-gray-800 bg-opacity-60 p-6 rounded-lg border border-gray-700 hover:border-red-500 transition">
                <Shield className="w-12 h-12 text-red-500 mb-4" />
                <h4 className="text-xl font-semibold mb-3">{tx("Унікальні моди, створені вручну")}</h4>
                <p className="text-gray-400">
                  {tx("Усі ключові модифікації — це наша власна робота, наш стиль і бачення Зони. Тут перероблено або створено з нуля:")}<br />
                  {tx("- система чищення та обслуговування зброї,")}<br />
                  {tx("- глибоке приготування їжі,")}<br />
                  {tx("- медична система за авторством Терджу,")}<br />
                  {tx("- повноцінний артхантинг, а не «збір грибів»,")}<br />
                  {tx("- мисливські механіки,")}<br />
                  {tx("- жива та складна економіка,")}<br />
                  {tx("- десятки дрібних, але важливих механік,")}<br />
                  {tx("які роблять виживання логічним, а РП — глибоким.")}<br />

                  <br />

                  {tx("Кожен мод — це роздуми, тести, робота руками й серцем.")}</p>
              </div>

              <div className="bg-gray-800 bg-opacity-60 p-6 rounded-lg border border-gray-700 hover:border-red-500 transition">
                <Users className="w-12 h-12 text-red-500 mb-4" />
                <h4 className="text-xl font-semibold mb-3">{tx("Від фанатів — для фанатів")}</h4>
                <p className="text-gray-400">
                  {tx("Цей проєкт створений людьми, які жили сталкерською атмосферою задовго до появи DayZ.")}<br />
                  {tx("Наша команда — це старі фанати серії S.T.A.L.K.E.R., які перенесли у Зону:")}<br />

                  {tx("- любов до деталей,")}<br />

                  {tx("- повагу до первісної атмосфери,")}<br />

                  {tx("- ідею реалістичного виживання.")}<br />
                  <br />
                  {tx("Ми не робимо \"просто сервер\" — ми створюємо місце, де S.T.A.L.K.E.R. оживає таким, яким мав бути.")}</p>
              </div>

              <div className="bg-gray-800 bg-opacity-60 p-6 rounded-lg border border-gray-700 hover:border-red-500 transition">
                <BookOpen className="w-12 h-12 text-red-500 mb-4" />
                <h4 className="text-xl font-semibold mb-3">{tx("Атмосфера того самого Сталкера")}</h4>
                <p className="text-gray-400">
                  {tx("У нашій Зоні ти не герой і не суперсолдат.")}<br />
                  {tx("Ти — маленька людина, яка намагається вижити там, де світ тебе не помічає.")}<br />

                  {tx("Тут:")}<br />

                  {tx("- ти боїшся ночі, бо чуєш те, чого краще не чути;")}<br />

                  {tx("- ти відчуваєш ціну кожного патрона;")}<br />

                  {tx("- ти думаєш, перш ніж стріляти;")}<br />

                  {tx("- ти цінуєш кожен ковток чистої води;")}<br />

                  {tx("- ти розумієш, що бути сталкером — це не пафос, а робота, страх і боротьба.")}<br />
                  <br />
                  {tx("Атмосфера — не декорація.")}<br />
                  {tx("Вона змушує тебе жити у Зоні, а не пробігати її, як черговий квест.")}</p>
              </div>

              <div className="bg-gray-800 bg-opacity-60 p-6 rounded-lg border border-gray-700 hover:border-red-500 transition">
                <Kanban className="w-12 h-12 text-red-500 mb-4" />
                <h4 className="text-xl font-semibold mb-3">{tx("Свій власний ЛОР, що формується гравцями")}</h4>
                <p className="text-gray-400">
                  {tx("Лор сервера розвивається з відкриття у 2023 році")}<br /> {tx(" та безпосередньо базується на діях гравців.")}<br /><br />
                  {tx("У внутрішньому світі проєкту сама Зона існує з 2006 року,")}<br /> {tx(" перші сталкери почали проникати через периметр у 2010 році,")}<br /> {tx(" закладаючи основу для розвитку подій, угруповань,")}<br /> {tx(" конфліктів і загальної історії сервера.")}<br />

                  {tx("Тут саме гравці формують Зону:")}<br />
                  {tx("- кожен вибір,")}<br /> {tx(" - кожна дія,")}<br /> {tx(" - кожна угода чи конфлікт")}<br /><br /> {tx(" Усе має наслідки та впливає на те,")}<br /> {tx(" якими будуть сюжет і атмосфера вашого світу.")}</p>
              </div>



            </div>
          </div>
        </section>

        <section id="rules" className="py-16 px-4">
          <div className="container mx-auto max-w-4xl">
            <h3 className="text-3xl font-bold mb-8 text-center">{t('mainRulesTitle')}</h3>
            <div className="bg-gray-800 bg-opacity-60 p-8 rounded-lg border border-gray-700">
              <ol className="space-y-4 text-gray-300">
                <li className="flex gap-3">
                  <span className="text-red-500 font-bold">1.</span>
                  <div>
                    <strong>{tx("Roleplay понад усе.")}</strong> {tx(" Всі дії повинні бути обґрунтовані з точки зору вашого персонажа.")}</div>
                </li>
                <li className="flex gap-3">
                  <span className="text-red-500 font-bold">2.</span>
                  <div>
                    <strong>{tx("Заборонено RDM.")}</strong> {tx(" Вбивство без roleplay причини карається баном.")}</div>
                </li>
                <li className="flex gap-3">
                  <span className="text-red-500 font-bold">3.</span>
                  <div>
                    <strong>{tx("Цінуйте життя персонажа.")}</strong> {tx(" Fear RP обов'язковий - ваш герой боїться смерті.")}</div>
                </li>
                <li className="flex gap-3">
                  <span className="text-red-500 font-bold">4.</span>
                  <div>
                    <strong>{tx("Метагейминг заборонено.")}</strong> {tx(" Використання інформації, отриманої поза грою, — порушення.")}</div>
                </li>
                <li className="flex gap-3">
                  <span className="text-red-500 font-bold">5.</span>
                  <div>
                    <strong>{tx("Повага до інших.")}</strong> {tx(" Токсична поведінка та образи гравців неприпустимі.")}</div>
                </li>
                <li className="flex gap-3">
                  <span className="text-red-500 font-bold">6.</span>
                  <div>
                    <strong>{tx("Повні правила.")}</strong> {tx(" Обов'язкові для гри на сервері.")}</div>
                </li>
              </ol>
              <div className="mt-8 text-center">
                <a
                  href="/rules"
                  className="inline-block bg-red-600 hover:bg-red-500 px-6 py-2 rounded font-semibold transition"
                >
                  {t('fullRules')}
                </a>
              </div>
            </div>
          </div>
        </section>

        <section id="media" className="py-16 px-4 bg-gray-900 bg-opacity-80">
          <div className="container mx-auto">
            <h3 className="text-3xl font-bold mb-12 text-center">{t('media')}</h3>
            {loadingVideos ? (
              <div className="text-center py-12">
                <p className="text-gray-400">{tx("Завантаження відео...")}</p>
              </div>
            ) : videos.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-400">{tx("Відео поки що немає")}</p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {videos.map((video) => {
                  const youtubeId = extractYouTubeId(video.url);
                  const twitchId = extractTwitchId(video.url);

                  return (
                    <div
                      key={video.id}
                      className="bg-gray-800 bg-opacity-60 rounded-lg border border-gray-700 overflow-hidden hover:border-red-500 transition"
                    >
                      <div className="aspect-video bg-black">
                        {youtubeId ? (
                          <iframe
                            src={`https://www.youtube.com/embed/${youtubeId}`}
                            title={localizedText(video.title, video.title_en, language)}
                            className="w-full h-full"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                          />
                        ) : twitchId ? (
                          <iframe
                            src={`https://player.twitch.tv/?video=${twitchId}&parent=${window.location.hostname}`}
                            title={localizedText(video.title, video.title_en, language)}
                            className="w-full h-full"
                            allowFullScreen
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-500">
                            {tx("Не вдалося завантажити відео")}</div>
                        )}
                      </div>
                      <div className="p-4">
                        <h4 className="font-semibold text-lg mb-2">{localizedText(video.title, video.title_en, language)}</h4>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        <section id="faq" className="py-16 px-4">
          <div className="container mx-auto max-w-4xl">
            <h3 className="text-3xl font-bold mb-8 text-center">{t('faqTitle')}</h3>
            <p className="text-gray-400 text-center mb-12">
              {t('faqDescription')}
            </p>

            <div className="bg-gray-800 bg-opacity-60 rounded-lg border border-gray-700 p-8 text-center">
              <p className="text-gray-300 mb-6 text-lg">
                {tx("Маєте питання? Перегляньте нашу повну базу знань з відповідями на найпоширеніші питання.")}</p>
              <a
                href="/faq"
                className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-500 px-6 py-3 rounded-lg font-semibold transition text-lg"
              >
                <span>{t('allFaq')}</span>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </a>
            </div>
          </div>
        </section>

        <section id="discord" className="py-16 px-4 bg-gray-900 bg-opacity-80">
          <div className="container mx-auto text-center max-w-2xl">
            <h3 className="text-3xl font-bold mb-6">{tx("Приєднуйся до спільноти")}</h3>
            <p className="text-gray-300 mb-8">
              {tx("Наш Discord-сервер — це місце, де ти можеш знайти напарників, дізнатися останні новини та отримати підтримку.")}</p>
            <a
              href="https://discord.gg/stalkerua"
              className="inline-block bg-indigo-600 hover:bg-indigo-500 px-8 py-3 rounded-lg text-lg font-semibold transition shadow-xl"
            >
              {t('joinDiscord')}
            </a>
          </div>
        </section>

        <footer className="py-8 px-4 border-t border-gray-700 bg-black bg-opacity-60">
          <div className="container mx-auto text-center text-gray-400 text-sm">
            <div className="mb-4 flex justify-center gap-6">
              <Link to="/admin/login" className="hover:text-white transition">{t('adminPanel')}</Link>
            </div>
            <p>{tx("© 2025 Eternal ZONE. Усі права захищені.")}</p>
            <p className="mt-2">
              {tx("DayZ Standalone S.T.A.L.K.E.R. Roleplay Server. Не афілійований з GSC Game World або Bohemia Interactive.")}</p>
          </div>
        </footer>
      </div>

    </div>
  );
}
