import { useEffect, useState } from 'react';
import { useAdminAuth } from '../contexts/AdminAuthContext';
import { supabase } from '../lib/supabase';
import QuestionsManager from '../components/QuestionsManager';
import RulesManager from '../components/RulesManager';
import FAQManager from '../components/FAQManager';
import { showAlert, showConfirm, showPrompt } from '../utils/modals';
import {
  Users,
  FileText,
  Search,
  CheckCircle,
  XCircle,
  Eye,
  Edit,
  LogOut,
  BookOpen,
  Settings,
  Save,
  X,
  Trash2,
  Skull,
  Video,
  Plus,
  Ban,
  UserCheck,
  HelpCircle,
} from 'lucide-react';
import logoIcon from '../assets/a_7bf503427402fe411e336e01e8f6f15a.webp';

interface Character {
  id: string;
  name: string;
  surname: string;
  patronymic: string;
  nickname: string;
  discord_id: string;
  age: number;
  gender: string;
  faction: string;
  backstory: string;
  zone_motivation: string;
  status: string;
  created_at: string;
  user_id: string;
  height: number;
  weight: number;
  body_type: string;
  character_traits: string[];
  face_model: string;
  hair_color: string;
  eye_color: string;
  beard_style: string;
}

interface User {
  id: string;
  steam_id: string;
  steam_nickname: string;
  discord_id: string | null;
  discord_username: string | null;
  rules_passed: boolean;
  is_banned: boolean;
  created_at: string;
  last_login: string;
}

interface MediaVideo {
  id: string;
  title: string;
  description: string;
  video_url: string;
  platform: 'youtube' | 'twitch';
  thumbnail_url: string;
  display_order: number;
  is_visible: boolean;
  created_at: string;
  updated_at: string;
}

export default function AdminPanel() {
  const { admin, logout } = useAdminAuth();
  const [activeTab, setActiveTab] = useState<'characters' | 'questions' | 'rules' | 'tests' | 'users' | 'media' | 'faq'>('characters');
  const [characters, setCharacters] = useState<Character[]>([]);
  const [filter, setFilter] = useState<'all' | 'draft' | 'pending' | 'approved' | 'rejected' | 'dead'>('pending');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [editData, setEditData] = useState<Partial<Character>>({});
  const [tests, setTests] = useState<any[]>([]);
  const [selectedTest, setSelectedTest] = useState<any>(null);
  const [questionGrades, setQuestionGrades] = useState<boolean[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [mediaVideos, setMediaVideos] = useState<MediaVideo[]>([]);
  const [editingVideo, setEditingVideo] = useState<MediaVideo | null>(null);
  const [isAddingVideo, setIsAddingVideo] = useState(false);
  const [videoFormData, setVideoFormData] = useState({
    title: '',
    description: '',
    video_url: '',
    platform: 'youtube' as 'youtube' | 'twitch',
    thumbnail_url: '',
    display_order: 0,
    is_visible: true,
  });

  useEffect(() => {
    loadCharacters();
  }, [filter]);

  useEffect(() => {
    if (activeTab === 'tests') {
      loadTests();
    } else if (activeTab === 'users') {
      loadUsers();
    } else if (activeTab === 'media') {
      loadMediaVideos();
    }
  }, [activeTab]);

  async function loadCharacters() {
    setLoading(true);
    try {
      console.log('AdminPanel: Loading characters with filter:', filter);
      let query = supabase
        .from('characters')
        .select('*')
        .order('created_at', { ascending: false });

      if (filter !== 'all') {
        query = query.eq('status', filter);
      }

      const { data, error } = await query;

      if (error) {
        console.error('AdminPanel: Error from Supabase:', error);
        throw error;
      }
      console.log('AdminPanel: Loaded characters:', data);
      setCharacters(data || []);
    } catch (error) {
      console.error('Error loading characters:', error);
    } finally {
      setLoading(false);
    }
  }

  async function updateCharacterStatus(
    characterId: string,
    status: 'approved' | 'rejected',
    rejectionReason?: string
  ) {
    try {
      const updates: any = {
        status,
        ...(status === 'approved' && { approved_at: new Date().toISOString() }),
        ...(status === 'rejected' && { rejection_reason: rejectionReason }),
      };

      const { error } = await supabase
        .from('characters')
        .update(updates)
        .eq('id', characterId);

      if (error) throw error;

      await loadCharacters();
      setSelectedCharacter(null);
      await showAlert(`Персонаж ${status === 'approved' ? 'схвалено' : 'відхилено'}`, 'Успіх', 'success');
    } catch (error) {
      console.error('Error updating character:', error);
      await showAlert('Помилка при оновленні персонажа', 'Помилка', 'error');
    }
  }

  async function saveCharacterEdits() {
    if (!selectedCharacter) return;

    try {
      const { error } = await supabase
        .from('characters')
        .update(editData)
        .eq('id', selectedCharacter.id);

      if (error) throw error;

      await showAlert('Зміни збережено', 'Успіх', 'success');
      setEditMode(false);
      await loadCharacters();
      setSelectedCharacter(null);
    } catch (error) {
      console.error('Error saving character:', error);
      await showAlert('Помилка при збереженні', 'Помилка', 'error');
    }
  }

  function startEdit(character: Character) {
    setEditMode(true);
    setEditData({ ...character });
  }

  async function loadTests() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('rules_test_submissions')
        .select('*, users(steam_nickname)')
        .order('submitted_at', { ascending: false });

      if (error) throw error;
      setTests(data || []);
    } catch (error) {
      console.error('Error loading tests:', error);
    } finally {
      setLoading(false);
    }
  }

  async function saveTestReview(testId: string, approved: boolean, notes?: string) {
    try {
      const correctCount = questionGrades.filter(g => g === true).length;
      const totalCount = questionGrades.length;

      const reviewNote = notes || `Правильно: ${correctCount}/${totalCount}`;

      console.log('Saving test review:', { testId, approved, reviewNote, questionGrades });

      const { data, error } = await supabase
        .from('rules_test_submissions')
        .update({
          approved,
          reviewed: true,
          question_grades: questionGrades,
          review_notes: reviewNote
        })
        .eq('id', testId);

      console.log('Update result:', { data, error });

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      if (approved && selectedTest?.user_id) {
        const { error: userError } = await supabase
          .from('users')
          .update({ rules_passed: true })
          .eq('id', selectedTest.user_id);

        if (userError) {
          console.error('Error updating user rules_passed:', userError);
        }
      }

      await showAlert(approved ? 'Тест схвалено!' : 'Тест відхилено', 'Успіх', 'success');
      await loadTests();
      setSelectedTest(null);
      setQuestionGrades([]);
    } catch (error) {
      console.error('Error saving test review:', error);
      await showAlert(`Помилка при збереженні: ${error instanceof Error ? error.message : 'Невідома помилка'}`, 'Помилка', 'error');
    }
  }

  function toggleQuestionGrade(index: number) {
    const newGrades = [...questionGrades];
    newGrades[index] = !newGrades[index];
    setQuestionGrades(newGrades);
  }

  function openTestReview(test: any) {
    setSelectedTest(test);
    if (test.question_grades && test.question_grades.length > 0) {
      setQuestionGrades(test.question_grades);
    } else {
      setQuestionGrades(new Array(test.questions?.length || 15).fill(false));
    }
  }

  async function deleteTestSubmission(testId: string) {
    const confirmed = await showConfirm(
      'Ви впевнені, що хочете видалити цю здачу правил?',
      'Підтвердження',
      { type: 'danger', confirmText: 'Видалити', cancelText: 'Скасувати' }
    );
    if (!confirmed) return;

    try {
      const { error } = await supabase
        .from('rules_test_submissions')
        .delete()
        .eq('id', testId);

      if (error) throw error;

      await showAlert('Здачу правил видалено', 'Успіх', 'success');
      await loadTests();
      setSelectedTest(null);
    } catch (error) {
      console.error('Error deleting test submission:', error);
      await showAlert('Помилка при видаленні', 'Помилка', 'error');
    }
  }

  async function loadUsers() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setLoading(false);
    }
  }

  async function resetUserRules(userId: string) {
    const confirmed = await showConfirm(
      'Ви впевнені, що хочете скинути здачу правил для цього користувача? Він повинен буде здати правила заново.',
      'Підтвердження',
      { type: 'warning', confirmText: 'Скинути', cancelText: 'Скасувати' }
    );
    if (!confirmed) return;

    try {
      const { error } = await supabase
        .from('users')
        .update({ rules_passed: false })
        .eq('id', userId);

      if (error) throw error;

      await showAlert('Здачу правил скинуто. Користувач має здати правила заново.', 'Успіх', 'success');
      await loadUsers();
    } catch (error) {
      console.error('Error resetting user rules:', error);
      await showAlert('Помилка при скиданні правил', 'Помилка', 'error');
    }
  }

  async function deleteCharacter(characterId: string) {
    const confirmed = await showConfirm(
      'Ви впевнені, що хочете видалити цього персонажа? Цю дію неможливо скасувати.',
      'Підтвердження',
      { type: 'danger', confirmText: 'Видалити', cancelText: 'Скасувати' }
    );
    if (!confirmed) return;

    try {
      const { error } = await supabase
        .from('characters')
        .delete()
        .eq('id', characterId);

      if (error) throw error;

      await showAlert('Персонажа видалено', 'Успіх', 'success');
      await loadCharacters();
      setSelectedCharacter(null);
      setEditMode(false);
    } catch (error) {
      console.error('Error deleting character:', error);
      await showAlert('Помилка при видаленні персонажа', 'Помилка', 'error');
    }
  }

  async function loadMediaVideos() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('media_videos')
        .select('*')
        .order('display_order', { ascending: true });

      if (error) throw error;
      setMediaVideos(data || []);
    } catch (error) {
      console.error('Error loading media videos:', error);
    } finally {
      setLoading(false);
    }
  }

  async function saveMediaVideo() {
    try {
      if (editingVideo) {
        const { error } = await supabase
          .from('media_videos')
          .update({
            ...videoFormData,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingVideo.id);

        if (error) throw error;
        await showAlert('Відео оновлено', 'Успіх', 'success');
      } else {
        const { error } = await supabase
          .from('media_videos')
          .insert([videoFormData]);

        if (error) throw error;
        await showAlert('Відео додано', 'Успіх', 'success');
      }

      resetVideoForm();
      await loadMediaVideos();
    } catch (error) {
      console.error('Error saving video:', error);
      await showAlert('Помилка при збереженні відео', 'Помилка', 'error');
    }
  }

  async function deleteMediaVideo(videoId: string) {
    const confirmed = await showConfirm(
      'Ви впевнені, що хочете видалити це відео?',
      'Підтвердження',
      { type: 'danger', confirmText: 'Видалити', cancelText: 'Скасувати' }
    );
    if (!confirmed) return;

    try {
      const { error } = await supabase
        .from('media_videos')
        .delete()
        .eq('id', videoId);

      if (error) throw error;
      await showAlert('Відео видалено', 'Успіх', 'success');
      await loadMediaVideos();
    } catch (error) {
      console.error('Error deleting video:', error);
      await showAlert('Помилка при видаленні відео', 'Помилка', 'error');
    }
  }

  async function editUserDiscord(userId: string, currentDiscord: string) {
    const newDiscord = await showPrompt(
      'Редагувати Discord username користувача:',
      'Discord Username',
      { defaultValue: currentDiscord, placeholder: 'username#0000' }
    );

    if (newDiscord === null) return;

    try {
      const { error } = await supabase
        .from('users')
        .update({ discord_username: newDiscord.trim() || null })
        .eq('id', userId);

      if (error) throw error;
      await showAlert('Discord username оновлено', 'Успіх', 'success');
      await loadUsers();
    } catch (error) {
      console.error('Error updating discord username:', error);
      await showAlert('Помилка оновлення Discord username', 'Помилка', 'error');
    }
  }

  async function banUser(userId: string, currentBanStatus: boolean) {
    if (currentBanStatus) {
      const confirmed = await showConfirm(
        'Розблокувати цього користувача?',
        'Підтвердження розблокування',
        { type: 'info', confirmText: 'Розблокувати', cancelText: 'Скасувати' }
      );
      if (!confirmed) return;

      try {
        const { error } = await supabase
          .from('users')
          .update({
            is_banned: false,
            banned_at: null,
            ban_reason: null
          })
          .eq('id', userId);

        if (error) throw error;
        await showAlert('Користувача розблоковано', 'Успіх', 'success');
        await loadUsers();
      } catch (error) {
        console.error('Error unbanning user:', error);
        await showAlert('Помилка при розблокуванні користувача', 'Помилка', 'error');
      }
    } else {
      const reason = await showPrompt(
        'Введіть причину блокування користувача:',
        'Причина блокування',
        { multiline: true, placeholder: 'Причина...' }
      );
      if (!reason) return;

      try {
        const { error } = await supabase
          .from('users')
          .update({
            is_banned: true,
            banned_at: new Date().toISOString(),
            ban_reason: reason
          })
          .eq('id', userId);

        if (error) throw error;
        await showAlert('Користувача заблоковано', 'Успіх', 'success');
        await loadUsers();
      } catch (error) {
        console.error('Error banning user:', error);
        await showAlert('Помилка при блокуванні користувача', 'Помилка', 'error');
      }
    }
  }

  function startEditVideo(video: MediaVideo) {
    setEditingVideo(video);
    setVideoFormData({
      title: video.title,
      description: video.description,
      video_url: video.video_url,
      platform: video.platform,
      thumbnail_url: video.thumbnail_url,
      display_order: video.display_order,
      is_visible: video.is_visible,
    });
    setIsAddingVideo(true);
  }

  function resetVideoForm() {
    setEditingVideo(null);
    setIsAddingVideo(false);
    setVideoFormData({
      title: '',
      description: '',
      video_url: '',
      platform: 'youtube',
      thumbnail_url: '',
      display_order: 0,
      is_visible: true,
    });
  }

  const filteredCharacters = characters.filter(
    (char) =>
      char.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      char.surname.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (char.nickname && char.nickname.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-black text-gray-100">
      <header className="border-b border-gray-700 bg-black bg-opacity-98 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img src={logoIcon} alt="Eternal ZONE" className="w-10 h-10 object-contain" />
              <div>
                <h1 className="text-xl font-bold font-stalker">Адмін-панель</h1>
                <p className="text-xs text-gray-400">
                  {admin?.username} ({admin?.role})
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <a href="/" className="text-sm text-gray-400 hover:text-white transition">
                На головну
              </a>
              <button
                onClick={logout}
                className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white transition"
              >
                <LogOut className="w-4 h-4" />
                Вийти
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="mb-6 flex gap-2">
          <button
            onClick={() => setActiveTab('characters')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded transition ${
              activeTab === 'characters'
                ? 'bg-red-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            <Users className="w-5 h-5" />
            Персонажі
          </button>
          <button
            onClick={() => setActiveTab('questions')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded transition ${
              activeTab === 'questions'
                ? 'bg-red-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            <FileText className="w-5 h-5" />
            Банк питань
          </button>
          <button
            onClick={() => setActiveTab('tests')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded transition ${
              activeTab === 'tests'
                ? 'bg-red-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            <BookOpen className="w-5 h-5" />
            Здача правил
          </button>
          <button
            onClick={() => setActiveTab('rules')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded transition ${
              activeTab === 'rules'
                ? 'bg-red-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            <BookOpen className="w-5 h-5" />
            Правила
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded transition ${
              activeTab === 'users'
                ? 'bg-red-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            <Users className="w-5 h-5" />
            Користувачі
          </button>
          <button
            onClick={() => setActiveTab('faq')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded transition ${
              activeTab === 'faq'
                ? 'bg-red-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            <HelpCircle className="w-5 h-5" />
            FAQ
          </button>
          <button
            onClick={() => setActiveTab('media')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded transition ${
              activeTab === 'media'
                ? 'bg-red-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            <Video className="w-5 h-5" />
            Медіа
          </button>
        </div>

        {activeTab === 'characters' && (
          <>
            <div className="grid md:grid-cols-5 gap-4 mb-8">
              <div className="bg-gray-800 bg-opacity-60 p-4 rounded-lg border border-gray-700">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400">Чернетки</p>
                    <p className="text-2xl font-bold text-gray-400">
                      {characters.filter((c) => c.status === 'draft').length}
                    </p>
                  </div>
                  <Edit className="w-8 h-8 text-gray-400" />
                </div>
              </div>

              <div className="bg-gray-800 bg-opacity-60 p-4 rounded-lg border border-gray-700">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400">На розгляді</p>
                    <p className="text-2xl font-bold text-yellow-500">
                      {characters.filter((c) => c.status === 'pending').length}
                    </p>
                  </div>
                  <FileText className="w-8 h-8 text-yellow-500" />
                </div>
              </div>

              <div className="bg-gray-800 bg-opacity-60 p-4 rounded-lg border border-gray-700">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400">Схвалено</p>
                    <p className="text-2xl font-bold text-green-500">
                      {characters.filter((c) => c.status === 'approved').length}
                    </p>
                  </div>
                  <CheckCircle className="w-8 h-8 text-green-500" />
                </div>
              </div>

              <div className="bg-gray-800 bg-opacity-60 p-4 rounded-lg border border-gray-700">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400">Відхилено</p>
                    <p className="text-2xl font-bold text-red-500">
                      {characters.filter((c) => c.status === 'rejected').length}
                    </p>
                  </div>
                  <XCircle className="w-8 h-8 text-red-500" />
                </div>
              </div>

              <div className="bg-gray-800 bg-opacity-60 p-4 rounded-lg border border-gray-700">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400">Мертві</p>
                    <p className="text-2xl font-bold text-gray-400">
                      {characters.filter((c) => c.status === 'dead').length}
                    </p>
                  </div>
                  <Skull className="w-8 h-8 text-gray-400" />
                </div>
              </div>

              <div className="bg-gray-800 bg-opacity-60 p-4 rounded-lg border border-gray-700">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400">Всього</p>
                    <p className="text-2xl font-bold text-blue-500">
                      {new Set(characters.map((c) => c.user_id)).size}
                    </p>
                  </div>
                  <Users className="w-8 h-8 text-blue-500" />
                </div>
              </div>
            </div>

            <div className="bg-gray-800 bg-opacity-60 p-6 rounded-lg border border-gray-700">
              <div className="mb-6 flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Пошук персонажів..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-gray-900 border border-gray-700 rounded pl-10 pr-4 py-2 focus:outline-none focus:border-red-500"
                  />
                </div>

                <div className="flex gap-2 flex-wrap">
                  {(['all', 'draft', 'pending', 'approved', 'rejected', 'dead'] as const).map((f) => (
                    <button
                      key={f}
                      onClick={() => setFilter(f)}
                      className={`px-4 py-2 rounded transition ${
                        filter === f
                          ? 'bg-red-600 text-white'
                          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      }`}
                    >
                      {f === 'all' && 'Всі'}
                      {f === 'draft' && 'Чернетки'}
                      {f === 'pending' && 'На розгляді'}
                      {f === 'approved' && 'Схвалені'}
                      {f === 'rejected' && 'Відхилені'}
                      {f === 'dead' && 'Мертві'}
                    </button>
                  ))}
                </div>
              </div>

              {loading ? (
                <div className="text-center py-12">
                  <p className="text-gray-400">Завантаження...</p>
                </div>
              ) : filteredCharacters.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-400">Персонажі не знайдено</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredCharacters.map((character) => (
                    <div
                      key={character.id}
                      className="bg-gray-900 bg-opacity-60 p-4 rounded border border-gray-700 hover:border-gray-600 transition"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg mb-1">
                            {character.name} {character.patronymic ? `${character.patronymic} ` : ''}{character.surname}
                            {character.nickname && (
                              <span className="text-gray-400 ml-2">"{character.nickname}"</span>
                            )}
                          </h3>
                          <p className="text-sm text-gray-400">
                            {character.age} років • {character.gender === 'male' ? 'Чоловік' : 'Жінка'} •{' '}
                            {character.faction}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            Discord: {character.discord_id || 'не вказано'}
                          </p>
                          <p className="text-xs text-yellow-400 mt-1">
                            Steam ID: {character.steam_id || 'не вказано'}
                          </p>
                        </div>

                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              setSelectedCharacter(character);
                              setEditMode(false);
                            }}
                            className="inline-flex items-center gap-2 bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded transition"
                          >
                            <Eye className="w-4 h-4" />
                            Переглянути
                          </button>
                          {character.status === 'pending' && (
                            <>
                              <button
                                onClick={() => updateCharacterStatus(character.id, 'approved')}
                                className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-500 px-4 py-2 rounded transition"
                              >
                                <CheckCircle className="w-4 h-4" />
                                Схвалити
                              </button>
                              <button
                                onClick={async () => {
                                  const reason = await showPrompt(
                                    'Введіть причину відхилення:',
                                    'Причина відхилення',
                                    { multiline: true, placeholder: 'Причина...' }
                                  );
                                  if (reason) {
                                    updateCharacterStatus(character.id, 'rejected', reason);
                                  }
                                }}
                                className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-500 px-4 py-2 rounded transition"
                              >
                                <XCircle className="w-4 h-4" />
                                Відхилити
                              </button>
                            </>
                          )}
                          {(character.status === 'approved' || character.status === 'active') && (
                            <button
                              onClick={async () => {
                                const confirmed = await showConfirm(
                                  `Позначити персонажа "${character.nickname}" як мертвого? Це дозволить гравцю створити нового персонажа та зробить позивний доступним.`,
                                  'Підтвердження смерті персонажа',
                                  { type: 'warning', confirmText: 'Позначити мертвим', cancelText: 'Скасувати' }
                                );
                                if (confirmed) {
                                  updateCharacterStatus(character.id, 'dead');
                                }
                              }}
                              className="inline-flex items-center gap-2 bg-black hover:bg-gray-900 border border-gray-600 px-4 py-2 rounded transition"
                            >
                              <Skull className="w-4 h-4" />
                              Позначити мертвим
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {activeTab === 'questions' && (
          <div className="bg-gray-800 bg-opacity-60 p-6 rounded-lg border border-gray-700">
            <QuestionsManager />
          </div>
        )}

        {activeTab === 'tests' && (
          <div className="bg-gray-800 bg-opacity-60 p-6 rounded-lg border border-gray-700">
            <h2 className="text-2xl font-bold mb-6">Здача правил</h2>
            {loading ? (
              <p className="text-gray-400">Завантаження...</p>
            ) : tests.length === 0 ? (
              <p className="text-gray-400">Немає жодної здачі</p>
            ) : (
              <div className="space-y-4">
                {tests.map((test) => (
                  <div
                    key={test.id}
                    className="bg-gray-900 bg-opacity-60 p-4 rounded border border-gray-700 hover:border-gray-600 transition cursor-pointer"
                    onClick={() => openTestReview(test)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold">
                          {test.users?.steam_nickname || 'Невідомий користувач'}
                        </p>
                        <p className="text-sm text-gray-400">Steam ID: {test.steam_id}</p>
                        <p className="text-sm text-gray-400">Discord ID: {test.discord_id}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(test.submitted_at).toLocaleString('uk-UA')}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        {test.reviewed ? (
                          test.approved ? (
                            <span className="px-3 py-1 bg-green-600 rounded text-sm">Схвалено</span>
                          ) : (
                            <span className="px-3 py-1 bg-red-600 rounded text-sm">Відхилено</span>
                          )
                        ) : (
                          <span className="px-3 py-1 bg-yellow-600 rounded text-sm">На розгляді</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'rules' && (
          <div className="bg-gray-800 bg-opacity-60 p-6 rounded-lg border border-gray-700">
            <RulesManager />
          </div>
        )}

        {activeTab === 'faq' && (
          <div className="bg-gray-800 bg-opacity-60 p-6 rounded-lg border border-gray-700">
            <FAQManager />
          </div>
        )}

        {activeTab === 'users' && (
          <div className="bg-gray-800 bg-opacity-60 rounded-lg border border-gray-700 overflow-hidden">
            <div className="p-6">
              <h2 className="text-2xl font-bold mb-6">Користувачі</h2>

              {loading ? (
                <p className="text-gray-400 text-center py-8">Завантаження...</p>
              ) : users.length === 0 ? (
                <p className="text-gray-400 text-center py-8">Користувачі відсутні</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-700">
                        <th className="text-left py-3 px-4">Steam Nickname</th>
                        <th className="text-left py-3 px-4">Steam ID</th>
                        <th className="text-left py-3 px-4">Discord</th>
                        <th className="text-left py-3 px-4">Правила</th>
                        <th className="text-left py-3 px-4">Статус</th>
                        <th className="text-left py-3 px-4">Дата реєстрації</th>
                        <th className="text-left py-3 px-4">Дії</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((user) => (
                        <tr key={user.id} className="border-b border-gray-700 hover:bg-gray-700 hover:bg-opacity-30">
                          <td className="py-3 px-4">{user.steam_nickname}</td>
                          <td className="py-3 px-4 font-mono text-sm">{user.steam_id}</td>
                          <td className="py-3 px-4 text-sm">
                            <div className="flex items-center gap-2">
                              {user.discord_username ? (
                                <span>{user.discord_username}</span>
                              ) : (
                                <span className="text-gray-500">Не вказано</span>
                              )}
                              <button
                                onClick={() => editUserDiscord(user.id, user.discord_username || '')}
                                className="p-1 hover:bg-gray-700 rounded"
                                title="Редагувати Discord username"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            {user.rules_passed ? (
                              <span className="inline-flex items-center gap-1 text-green-400 font-semibold">
                                <CheckCircle className="w-4 h-4" />
                                Здано
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-red-400">
                                <XCircle className="w-4 h-4" />
                                Не здано
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            {user.is_banned ? (
                              <span className="inline-flex items-center gap-1 text-red-500 font-semibold">
                                <Ban className="w-4 h-4" />
                                Заблоковано
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-green-400">
                                <UserCheck className="w-4 h-4" />
                                Активний
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-400">
                            {new Date(user.created_at).toLocaleDateString('uk-UA')}
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              {user.rules_passed && !user.is_banned && (
                                <button
                                  onClick={() => resetUserRules(user.id)}
                                  className="inline-flex items-center gap-2 bg-orange-600 hover:bg-orange-500 px-3 py-1 rounded text-sm transition"
                                >
                                  <BookOpen className="w-4 h-4" />
                                  На перездачу
                                </button>
                              )}
                              <button
                                onClick={() => banUser(user.id, user.is_banned)}
                                className={`inline-flex items-center gap-2 px-3 py-1 rounded text-sm transition ${
                                  user.is_banned
                                    ? 'bg-green-600 hover:bg-green-500'
                                    : 'bg-red-600 hover:bg-red-500'
                                }`}
                              >
                                {user.is_banned ? (
                                  <>
                                    <UserCheck className="w-4 h-4" />
                                    Розблокувати
                                  </>
                                ) : (
                                  <>
                                    <Ban className="w-4 h-4" />
                                    Заблокувати
                                  </>
                                )}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'media' && (
          <div className="bg-gray-800 bg-opacity-60 p-6 rounded-lg border border-gray-700">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Медіа відео</h2>
              <button
                onClick={() => setIsAddingVideo(true)}
                className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-500 px-4 py-2 rounded transition"
              >
                <Plus className="w-5 h-5" />
                Додати відео
              </button>
            </div>

            {loading ? (
              <p className="text-gray-400 text-center py-8">Завантаження...</p>
            ) : mediaVideos.length === 0 ? (
              <p className="text-gray-400 text-center py-8">Відео відсутні</p>
            ) : (
              <div className="space-y-4">
                {mediaVideos.map((video) => (
                  <div
                    key={video.id}
                    className="bg-gray-900 bg-opacity-60 p-4 rounded border border-gray-700"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg mb-1">{video.title}</h3>
                        <p className="text-sm text-gray-400 mb-2">{video.description}</p>
                        <div className="flex items-center gap-4 text-sm">
                          <span className="text-gray-500">
                            Платформа: <span className="text-white">{video.platform}</span>
                          </span>
                          <span className="text-gray-500">
                            Порядок: <span className="text-white">{video.display_order}</span>
                          </span>
                          <span className={video.is_visible ? 'text-green-400' : 'text-red-400'}>
                            {video.is_visible ? 'Відображається' : 'Приховано'}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-2">URL: {video.video_url}</p>
                      </div>
                      <div className="flex gap-2 ml-4">
                        <button
                          onClick={() => startEditVideo(video)}
                          className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 px-3 py-2 rounded transition"
                        >
                          <Edit className="w-4 h-4" />
                          Редагувати
                        </button>
                        <button
                          onClick={() => deleteMediaVideo(video.id)}
                          className="inline-flex items-center gap-2 bg-red-900 hover:bg-red-800 px-3 py-2 rounded transition"
                        >
                          <Trash2 className="w-4 h-4" />
                          Видалити
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {selectedCharacter && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-2xl font-bold mb-2">
                    {selectedCharacter.name} {selectedCharacter.patronymic ? `${selectedCharacter.patronymic} ` : ''}{selectedCharacter.surname}
                  </h2>
                  {selectedCharacter.nickname && (
                    <p className="text-gray-400">"{selectedCharacter.nickname}"</p>
                  )}
                </div>
                <div className="flex gap-2">
                  {!editMode && (
                    <>
                      <button
                        onClick={() => startEdit(selectedCharacter)}
                        className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded transition"
                      >
                        <Edit className="w-4 h-4" />
                        Редагувати
                      </button>
                      <button
                        onClick={() => deleteCharacter(selectedCharacter.id)}
                        className="inline-flex items-center gap-2 bg-red-900 hover:bg-red-800 px-4 py-2 rounded transition"
                      >
                        <Trash2 className="w-4 h-4" />
                        Видалити
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => {
                      setSelectedCharacter(null);
                      setEditMode(false);
                    }}
                    className="text-gray-400 hover:text-white"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>

              {editMode ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Ім'я</label>
                      <input
                        type="text"
                        value={editData.name || ''}
                        onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                        className="w-full bg-gray-900 border border-gray-700 rounded px-4 py-2 focus:outline-none focus:border-red-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Прізвище</label>
                      <input
                        type="text"
                        value={editData.surname || ''}
                        onChange={(e) => setEditData({ ...editData, surname: e.target.value })}
                        className="w-full bg-gray-900 border border-gray-700 rounded px-4 py-2 focus:outline-none focus:border-red-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Кличка</label>
                    <input
                      type="text"
                      value={editData.nickname || ''}
                      onChange={(e) => setEditData({ ...editData, nickname: e.target.value })}
                      className="w-full bg-gray-900 border border-gray-700 rounded px-4 py-2 focus:outline-none focus:border-red-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Discord ID</label>
                    <input
                      type="text"
                      value={editData.discord_id || ''}
                      onChange={(e) => setEditData({ ...editData, discord_id: e.target.value })}
                      className="w-full bg-gray-900 border border-gray-700 rounded px-4 py-2 focus:outline-none focus:border-red-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Біографія</label>
                    <textarea
                      value={editData.backstory || ''}
                      onChange={(e) => setEditData({ ...editData, backstory: e.target.value })}
                      rows={8}
                      className="w-full bg-gray-900 border border-gray-700 rounded px-4 py-2 focus:outline-none focus:border-red-500 resize-none"
                    />
                  </div>

                  <div className="flex gap-2 pt-4">
                    <button
                      onClick={saveCharacterEdits}
                      className="flex-1 inline-flex items-center justify-center gap-2 bg-green-600 hover:bg-green-500 py-3 rounded font-semibold transition"
                    >
                      <Save className="w-5 h-5" />
                      Зберегти зміни
                    </button>
                    <button
                      onClick={() => setEditMode(false)}
                      className="flex-1 bg-gray-700 hover:bg-gray-600 py-3 rounded font-semibold transition"
                    >
                      Скасувати
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-400">Discord ID</p>
                      <p className="font-semibold">{selectedCharacter.discord_id || 'Не вказано'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Steam ID</p>
                      <p className="font-semibold font-mono text-sm">{selectedCharacter.steam_id}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Вік</p>
                      <p className="font-semibold">{selectedCharacter.age} років</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Стать</p>
                      <p className="font-semibold">
                        {selectedCharacter.gender === 'male' ? 'Чоловік' : 'Жінка'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Зріст</p>
                      <p className="font-semibold">{selectedCharacter.height || 'Не вказано'} см</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Вага</p>
                      <p className="font-semibold">{selectedCharacter.weight || 'Не вказано'} кг</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Тип тіла</p>
                      <p className="font-semibold">{selectedCharacter.body_type || 'Не вказано'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Фракція</p>
                      <p className="font-semibold">{selectedCharacter.faction}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Статус</p>
                      <p className="font-semibold">{selectedCharacter.status}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Модель обличчя</p>
                      <p className="font-semibold">{selectedCharacter.face_model || 'Не вказано'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Колір волосся</p>
                      <p className="font-semibold">{selectedCharacter.hair_color || 'Не вказано'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Колір очей</p>
                      <p className="font-semibold">{selectedCharacter.eye_color || 'Не вказано'}</p>
                    </div>
                  </div>

                  {selectedCharacter.special_features && (
                    <div>
                      <p className="text-sm text-gray-400 mb-2">Особливості обличчя</p>
                      <div className="bg-gray-900 p-3 rounded border border-gray-700">
                        <p>{selectedCharacter.special_features}</p>
                      </div>
                    </div>
                  )}

                  {selectedCharacter.physical_features && (
                    <div>
                      <p className="text-sm text-gray-400 mb-2">Фізичні прикмети</p>
                      <div className="bg-gray-900 p-3 rounded border border-gray-700">
                        <p>{selectedCharacter.physical_features}</p>
                      </div>
                    </div>
                  )}

                  {selectedCharacter.character_traits &&
                    selectedCharacter.character_traits.length > 0 && (
                      <div>
                        <p className="text-sm text-gray-400 mb-2">Риси характеру</p>
                        <div className="flex flex-wrap gap-2">
                          {selectedCharacter.character_traits.map((trait) => (
                            <span
                              key={trait}
                              className="bg-red-900 bg-opacity-30 px-3 py-1 rounded text-sm"
                            >
                              {trait}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                  {selectedCharacter.phobias && (
                    <div>
                      <p className="text-sm text-gray-400 mb-2">Фобії / Слабкості</p>
                      <div className="bg-gray-900 p-3 rounded border border-gray-700">
                        <p>{selectedCharacter.phobias}</p>
                      </div>
                    </div>
                  )}

                  {selectedCharacter.values && (
                    <div>
                      <p className="text-sm text-gray-400 mb-2">Життєві цінності</p>
                      <div className="bg-gray-900 p-3 rounded border border-gray-700">
                        <p>{selectedCharacter.values}</p>
                      </div>
                    </div>
                  )}

                  {selectedCharacter.faction === 'Учений' && (
                    <>
                      {selectedCharacter.education && (
                        <div>
                          <p className="text-sm text-gray-400 mb-2">Освіта</p>
                          <div className="bg-gray-900 p-3 rounded border border-gray-700">
                            <p>{selectedCharacter.education}</p>
                          </div>
                        </div>
                      )}
                      {selectedCharacter.scientific_profile && (
                        <div>
                          <p className="text-sm text-gray-400 mb-2">Науковий профіль</p>
                          <div className="bg-gray-900 p-3 rounded border border-gray-700">
                            <p>{selectedCharacter.scientific_profile}</p>
                          </div>
                        </div>
                      )}
                      {selectedCharacter.research_motivation && (
                        <div>
                          <p className="text-sm text-gray-400 mb-2">Мотивація досліджень</p>
                          <div className="bg-gray-900 p-3 rounded border border-gray-700">
                            <p>{selectedCharacter.research_motivation}</p>
                          </div>
                        </div>
                      )}
                    </>
                  )}

                  {selectedCharacter.faction === 'Військовий' && (
                    <>
                      {selectedCharacter.military_experience && (
                        <div>
                          <p className="text-sm text-gray-400 mb-2">Військовий досвід</p>
                          <div className="bg-gray-900 p-3 rounded border border-gray-700">
                            <p>{selectedCharacter.military_experience}</p>
                          </div>
                        </div>
                      )}
                      {selectedCharacter.military_rank && (
                        <div>
                          <p className="text-sm text-gray-400 mb-2">Військове звання</p>
                          <div className="bg-gray-900 p-3 rounded border border-gray-700">
                            <p>{selectedCharacter.military_rank}</p>
                          </div>
                        </div>
                      )}
                      {selectedCharacter.military_join_reason && (
                        <div>
                          <p className="text-sm text-gray-400 mb-2">Причина вступу до військових</p>
                          <div className="bg-gray-900 p-3 rounded border border-gray-700">
                            <p>{selectedCharacter.military_join_reason}</p>
                          </div>
                        </div>
                      )}
                    </>
                  )}

                  {selectedCharacter.backstory && (
                    <div>
                      <p className="text-sm text-gray-400 mb-2">Біографія ({selectedCharacter.backstory.length} символів)</p>
                      <div className="bg-gray-900 p-4 rounded border border-gray-700">
                        <p className="whitespace-pre-wrap break-words leading-relaxed">{selectedCharacter.backstory}</p>
                      </div>
                    </div>
                  )}

                  {selectedCharacter.zone_motivation && (
                    <div>
                      <p className="text-sm text-gray-400 mb-2">Мотивація приходу в Зону</p>
                      <div className="bg-gray-900 p-4 rounded border border-gray-700">
                        <p className="whitespace-pre-wrap">{selectedCharacter.zone_motivation}</p>
                      </div>
                    </div>
                  )}

                  {selectedCharacter.character_goals && (
                    <div>
                      <p className="text-sm text-gray-400 mb-2">Цілі персонажа</p>
                      <div className="bg-gray-900 p-4 rounded border border-gray-700">
                        <p className="whitespace-pre-wrap">{selectedCharacter.character_goals}</p>
                      </div>
                    </div>
                  )}

                  {selectedCharacter.status === 'pending' && (
                    <div className="flex gap-2 pt-4">
                      <button
                        onClick={() => {
                          updateCharacterStatus(selectedCharacter.id, 'approved');
                        }}
                        className="flex-1 bg-green-600 hover:bg-green-500 py-3 rounded font-semibold transition"
                      >
                        Схвалити персонажа
                      </button>
                      <button
                        onClick={async () => {
                          const reason = await showPrompt(
                            'Введіть причину відхилення:',
                            'Причина відхилення',
                            { multiline: true, placeholder: 'Причина...' }
                          );
                          if (reason) {
                            updateCharacterStatus(selectedCharacter.id, 'rejected', reason);
                          }
                        }}
                        className="flex-1 bg-red-600 hover:bg-red-500 py-3 rounded font-semibold transition"
                      >
                        Відхилити персонажа
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {isAddingVideo && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-gray-800 rounded-lg max-w-2xl w-full">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <h2 className="text-2xl font-bold">
                  {editingVideo ? 'Редагувати відео' : 'Додати відео'}
                </h2>
                <button
                  onClick={resetVideoForm}
                  className="text-gray-400 hover:text-white"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Назва відео</label>
                  <input
                    type="text"
                    value={videoFormData.title}
                    onChange={(e) => setVideoFormData({ ...videoFormData, title: e.target.value })}
                    className="w-full bg-gray-900 border border-gray-700 rounded px-4 py-2 focus:outline-none focus:border-red-500"
                    placeholder="Введіть назву відео"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Опис</label>
                  <textarea
                    value={videoFormData.description}
                    onChange={(e) => setVideoFormData({ ...videoFormData, description: e.target.value })}
                    rows={3}
                    className="w-full bg-gray-900 border border-gray-700 rounded px-4 py-2 focus:outline-none focus:border-red-500 resize-none"
                    placeholder="Введіть опис відео"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Платформа</label>
                  <select
                    value={videoFormData.platform}
                    onChange={(e) => setVideoFormData({ ...videoFormData, platform: e.target.value as 'youtube' | 'twitch' })}
                    className="w-full bg-gray-900 border border-gray-700 rounded px-4 py-2 focus:outline-none focus:border-red-500"
                  >
                    <option value="youtube">YouTube</option>
                    <option value="twitch">Twitch</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">URL відео</label>
                  <input
                    type="text"
                    value={videoFormData.video_url}
                    onChange={(e) => setVideoFormData({ ...videoFormData, video_url: e.target.value })}
                    className="w-full bg-gray-900 border border-gray-700 rounded px-4 py-2 focus:outline-none focus:border-red-500"
                    placeholder="https://www.youtube.com/watch?v=... або https://www.twitch.tv/videos/..."
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Для YouTube: https://www.youtube.com/watch?v=VIDEO_ID<br />
                    Для Twitch: https://www.twitch.tv/videos/VIDEO_ID
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">URL мініатюри (необов'язково)</label>
                  <input
                    type="text"
                    value={videoFormData.thumbnail_url}
                    onChange={(e) => setVideoFormData({ ...videoFormData, thumbnail_url: e.target.value })}
                    className="w-full bg-gray-900 border border-gray-700 rounded px-4 py-2 focus:outline-none focus:border-red-500"
                    placeholder="https://example.com/image.jpg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Порядок відображення</label>
                  <input
                    type="number"
                    value={videoFormData.display_order}
                    onChange={(e) => setVideoFormData({ ...videoFormData, display_order: parseInt(e.target.value) || 0 })}
                    className="w-full bg-gray-900 border border-gray-700 rounded px-4 py-2 focus:outline-none focus:border-red-500"
                    placeholder="0"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="is_visible"
                    checked={videoFormData.is_visible}
                    onChange={(e) => setVideoFormData({ ...videoFormData, is_visible: e.target.checked })}
                    className="w-4 h-4"
                  />
                  <label htmlFor="is_visible" className="text-sm">
                    Відображати на сайті
                  </label>
                </div>

                <div className="flex gap-2 pt-4">
                  <button
                    onClick={saveMediaVideo}
                    className="flex-1 bg-green-600 hover:bg-green-500 py-3 rounded font-semibold transition"
                  >
                    {editingVideo ? 'Зберегти зміни' : 'Додати відео'}
                  </button>
                  <button
                    onClick={resetVideoForm}
                    className="flex-1 bg-gray-700 hover:bg-gray-600 py-3 rounded font-semibold transition"
                  >
                    Скасувати
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedTest && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-2xl font-bold mb-2">Здача правил</h2>
                  <p className="text-gray-400">Steam ID: {selectedTest.steam_id}</p>
                  <p className="text-gray-400">Discord ID: {selectedTest.discord_id}</p>
                  <p className="text-sm text-gray-500">
                    Відправлено: {new Date(selectedTest.submitted_at).toLocaleString('uk-UA')}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedTest(null)}
                  className="text-gray-400 hover:text-white"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {!selectedTest.reviewed && (
                <div className="mb-6 bg-blue-900 bg-opacity-30 border border-blue-700 p-4 rounded">
                  <p className="text-blue-200 font-semibold mb-2">
                    Правильно: {questionGrades.filter(g => g === true).length}/{questionGrades.length}
                  </p>
                  <p className="text-blue-300 text-sm">
                    Натисніть на питання щоб позначити його як правильне/неправильне
                  </p>
                </div>
              )}

              <div className="space-y-4">
                {selectedTest.questions && selectedTest.questions.map((question: string, index: number) => (
                  <div
                    key={index}
                    onClick={() => !selectedTest.reviewed && toggleQuestionGrade(index)}
                    className={`p-4 rounded border transition ${
                      selectedTest.reviewed
                        ? 'bg-gray-900 bg-opacity-60 border-gray-700'
                        : questionGrades[index]
                        ? 'bg-green-900 bg-opacity-30 border-green-600 cursor-pointer hover:bg-green-900 hover:bg-opacity-40'
                        : 'bg-red-900 bg-opacity-30 border-red-600 cursor-pointer hover:bg-red-900 hover:bg-opacity-40'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <p className="font-semibold">Питання {index + 1}:</p>
                      {!selectedTest.reviewed && (
                        <span className={`text-lg font-bold ${questionGrades[index] ? 'text-green-400' : 'text-red-400'}`}>
                          {questionGrades[index] ? '✓' : '✗'}
                        </span>
                      )}
                      {selectedTest.reviewed && selectedTest.question_grades && (
                        <span className={`text-lg font-bold ${selectedTest.question_grades[index] ? 'text-green-400' : 'text-red-400'}`}>
                          {selectedTest.question_grades[index] ? '✓' : '✗'}
                        </span>
                      )}
                    </div>
                    <p className="text-gray-300 mb-4">{question}</p>
                    <p className="text-sm text-gray-400 mb-2">Відповідь:</p>
                    <div className="bg-black bg-opacity-30 p-3 rounded">
                      <p className="whitespace-pre-wrap">{selectedTest.answers?.[index] || 'Немає відповіді'}</p>
                    </div>
                  </div>
                ))}
              </div>

              {!selectedTest.reviewed && (
                <div className="flex gap-4 pt-6 mt-6 border-t border-gray-700">
                  <button
                    onClick={() => saveTestReview(selectedTest.id, true)}
                    className="flex-1 bg-green-600 hover:bg-green-500 py-3 rounded font-semibold transition"
                  >
                    Схвалити
                  </button>
                  <button
                    onClick={async () => {
                      const notes = await showPrompt(
                        'Введіть примітки (необов\'язково):',
                        'Примітки',
                        { multiline: true, placeholder: 'Примітки...', defaultValue: '' }
                      );
                      if (notes !== null) {
                        saveTestReview(selectedTest.id, false, notes || undefined);
                      }
                    }}
                    className="flex-1 bg-red-600 hover:bg-red-500 py-3 rounded font-semibold transition"
                  >
                    Відхилити
                  </button>
                </div>
              )}

              {selectedTest.reviewed && (
                <div className="pt-6 mt-6 border-t border-gray-700">
                  <p className="text-center mb-4">
                    {selectedTest.approved ? (
                      <span className="text-green-400 font-semibold">✓ Тест схвалено</span>
                    ) : (
                      <span className="text-red-400 font-semibold">✗ Тест відхилено</span>
                    )}
                  </p>
                  <button
                    onClick={() => deleteTestSubmission(selectedTest.id)}
                    className="w-full bg-red-900 hover:bg-red-800 py-3 rounded font-semibold transition flex items-center justify-center gap-2"
                  >
                    <Trash2 className="w-5 h-5" />
                    Видалити здачу
                  </button>
                  {selectedTest.review_notes && (
                    <p className="text-gray-400 text-sm text-center mt-2">
                      Примітки: {selectedTest.review_notes}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
