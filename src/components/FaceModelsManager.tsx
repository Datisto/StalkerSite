import { useTranslation } from '../hooks/useTranslation';
import { useEffect, useState } from 'react';
import { apiClient } from '../lib/api-client';
import { useLanguage } from '../contexts/language';

interface FaceModel {
  id: string;
  name: string;
  name_en?: string | null;
  is_active: boolean;
}

export default function FaceModelsManager() {
  const tx = useTranslation();
  const { t } = useLanguage();
  const [models, setModels] = useState<FaceModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState<string[]>([]);

  useEffect(() => {
    apiClient.faceModels.manage()
      .then(setModels)
      .catch((reason: unknown) => setError(reason instanceof Error ? reason.message : "Не вдалося завантажити моделі"))
      .finally(() => setLoading(false));
  }, []);

  async function save(model: FaceModel) {
    setError('');
    setSaving((current) => [...current, model.id]);
    try {
      // The stored model name is also a character identifier: only its display translation changes.
      await apiClient.faceModels.update(model.id, { name_en: model.name_en?.trim() || null });
      setSaved((current) => [...current, model.id]);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Не вдалося зберегти переклад");
    } finally {
      setSaving((current) => current.filter((id) => id !== model.id));
    }
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">{t('faceModels')}</h2>
      <p className="text-sm text-gray-400">{tx("Додайте англійський підпис. Якщо він порожній, показується початкова назва. Початкова назва та вибір облич у персонажів зберігаються.")}</p>
      {error && <p role="alert" className="text-red-400">{tx(error)}</p>}
      {loading && <p>{t('loading')}</p>}
      {!loading && models.length === 0 && <p className="text-gray-400">{tx("Моделей немає")}</p>}
      {models.map((model) => (
        <div key={model.id} className="flex flex-wrap items-end gap-4 rounded border border-gray-700 bg-gray-900 p-4">
          <div className="min-w-0 flex-1">
            <p className="mb-2 break-words font-semibold">{model.name}</p>
            {!model.is_active && <p className="mb-2 text-sm text-gray-400">{tx("Неактивна модель")}</p>}
            <label className="block text-sm">
              <span className="mb-2 block">{tx("Англійський підпис (EN)")}</span>
              <input
                type="text"
                lang="en"
                maxLength={255}
                value={model.name_en ?? ''}
                disabled={saving.includes(model.id)}
                onChange={(event) => {
                  setModels((current) => current.map((item) => item.id === model.id ? { ...item, name_en: event.target.value } : item));
                  setSaved((current) => current.filter((id) => id !== model.id));
                }}
                className="w-full rounded border border-gray-600 bg-gray-800 px-3 py-2"
              />
            </label>
          </div>
          <button type="button" onClick={() => save(model)} disabled={saving.includes(model.id)} className="rounded bg-green-700 px-4 py-2 hover:bg-green-600 disabled:opacity-50">
            {saving.includes(model.id) ? t('saving') : t('save')}
          </button>
          {saved.includes(model.id) && <span role="status" className="text-sm text-green-400">{tx("Збережено")}</span>}
        </div>
      ))}
    </div>
  );
}
