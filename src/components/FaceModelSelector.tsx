import { useCallback, useEffect, useState } from 'react';
import { apiClient } from '../lib/api-client';
import { CheckCircle, ChevronLeft, ChevronRight } from 'lucide-react';

interface FaceModel {
  id: string;
  name: string;
  image_url: string;
  is_unique: boolean;
  display_order: number;
  gender: 'male' | 'female';
}

interface FaceModelSelectorProps {
  selectedModel: string;
  onSelect: (modelName: string) => void;
  currentCharacterId?: string;
  gender: 'male' | 'female';
}

const ROWS_PER_PAGE = 4;

function getColumnCount(width: number) {
  if (width >= 1024) {
    return 4;
  }

  if (width >= 640) {
    return 3;
  }

  return 2;
}

function clampPage(page: number, totalPages: number) {
  if (totalPages <= 0) {
    return 0;
  }

  return Math.min(page, totalPages - 1);
}

export default function FaceModelSelector({
  selectedModel,
  onSelect,
  currentCharacterId,
  gender,
}: FaceModelSelectorProps) {
  const [faceModels, setFaceModels] = useState<FaceModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [unavailableModels, setUnavailableModels] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [columnCount, setColumnCount] = useState(() =>
    getColumnCount(typeof window === 'undefined' ? 1024 : window.innerWidth)
  );
  const [regularPage, setRegularPage] = useState(0);
  const [uniquePage, setUniquePage] = useState(0);

  const loadFaceModels = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const models = await apiClient.faceModels.list(gender);

      console.log('Loaded face models:', models);

      if (!models || models.length === 0) {
        console.warn('No face models found in database');
        setError('Моделі облич не знайдені в базі даних');
        setFaceModels([]);
        return;
      }

      const allCharacters = await apiClient.characters.list({ status: 'pending,approved,active' });
      const usedFaces = allCharacters.filter((character) => character.status !== 'dead');

      const uniqueModels = models?.filter((model) => model.is_unique) || [];
      const usedUniqueFaces = new Set(
        usedFaces
          ?.map((character) => character.face_model)
          .filter(
            (faceModel): faceModel is string =>
              typeof faceModel === 'string' &&
              uniqueModels.some((uniqueModel) => uniqueModel.name === faceModel)
          ) || []
      );

      if (currentCharacterId) {
        const currentChar = await apiClient.characters.get(currentCharacterId);

        if (currentChar?.face_model) {
          usedUniqueFaces.delete(currentChar.face_model);
        }
      }

      setUnavailableModels(usedUniqueFaces);
      setFaceModels(models || []);
    } catch (error) {
      console.error('Error loading face models:', error);
      setError(error instanceof Error ? error.message : 'Не вдалося завантажити моделі облич');
    } finally {
      setLoading(false);
    }
  }, [currentCharacterId, gender]);

  useEffect(() => {
    loadFaceModels();
  }, [loadFaceModels]);

  useEffect(() => {
    const handleResize = () => {
      setColumnCount(getColumnCount(window.innerWidth));
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const regularModels = faceModels.filter((m) => !m.is_unique);
  const uniqueModels = faceModels.filter((m) => m.is_unique);
  const pageSize = columnCount * ROWS_PER_PAGE;
  const regularTotalPages = Math.ceil(regularModels.length / pageSize);
  const uniqueTotalPages = Math.ceil(uniqueModels.length / pageSize);
  const regularPageModels = regularModels.slice(
    regularPage * pageSize,
    regularPage * pageSize + pageSize
  );
  const uniquePageModels = uniqueModels.slice(uniquePage * pageSize, uniquePage * pageSize + pageSize);

  useEffect(() => {
    setRegularPage((prev) => clampPage(prev, regularTotalPages));
  }, [regularTotalPages]);

  useEffect(() => {
    setUniquePage((prev) => clampPage(prev, uniqueTotalPages));
  }, [uniqueTotalPages]);

  if (loading) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-400">Завантаження моделей...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-400">{error}</p>
        <button
          onClick={loadFaceModels}
          className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 rounded"
        >
          Спробувати знову
        </button>
      </div>
    );
  }

  if (faceModels.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-400">Немає доступних моделей облич</p>
      </div>
    );
  }

  const renderPagination = (
    currentPage: number,
    totalPages: number,
    onPageChange: (page: number) => void
  ) => {
    if (totalPages <= 1) {
      return null;
    }

    return (
      <div className="mt-4 flex items-center justify-between gap-3 rounded-lg border border-gray-700 bg-gray-900/70 px-4 py-3">
        <button
          type="button"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 0}
          className="inline-flex items-center gap-2 rounded border border-gray-600 px-3 py-2 text-sm text-gray-200 transition hover:border-gray-500 hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <ChevronLeft className="h-4 w-4" />
          Попередня
        </button>

        <p className="text-sm text-gray-400">
          Сторінка {currentPage + 1} з {totalPages}
        </p>

        <button
          type="button"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages - 1}
          className="inline-flex items-center gap-2 rounded border border-gray-600 px-3 py-2 text-sm text-gray-200 transition hover:border-gray-500 hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Наступна
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    );
  };

  const renderModelGrid = (models: FaceModel[], isUniqueSection: boolean) => (
    <div
      className="grid gap-4"
      style={{ gridTemplateColumns: `repeat(${columnCount}, minmax(0, 1fr))` }}
    >
      {models.map((model) => {
        const isSelected = selectedModel === model.name;
        const isUnavailable = isUniqueSection && unavailableModels.has(model.name);

        return (
          <button
            key={model.id}
            type="button"
            onClick={() => !isUnavailable && onSelect(model.name)}
            disabled={isUnavailable}
            className={`relative overflow-hidden rounded-lg border-2 transition-all ${
              isUnavailable
                ? 'cursor-not-allowed border-gray-800 opacity-50'
                : isSelected
                ? 'border-red-500 ring-2 ring-red-500 ring-opacity-50'
                : isUniqueSection
                ? 'border-red-900 hover:border-red-700'
                : 'border-gray-700 hover:border-gray-500'
            }`}
          >
            <img
              src={model.image_url}
              alt={model.name}
              className={`w-full aspect-square object-cover ${isUnavailable ? 'grayscale' : ''}`}
            />
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-2">
              <p className="text-center text-sm font-medium text-white">{model.name}</p>
              {isUnavailable && (
                <p className="mt-1 text-center text-xs text-red-400">Зайнято</p>
              )}
            </div>
            {isSelected && (
              <div className="absolute right-2 top-2 rounded-full bg-red-500 p-1">
                <CheckCircle className="h-5 w-5 text-white" />
              </div>
            )}
            {isUniqueSection && !isUnavailable && (
              <div className="absolute left-2 top-2 rounded bg-red-600 px-2 py-1 text-xs font-semibold text-white">
                УНІКАЛЬНЕ
              </div>
            )}
          </button>
        );
      })}
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Стандартні моделі</h3>
        {renderModelGrid(regularPageModels, false)}
        {renderPagination(regularPage, regularTotalPages, setRegularPage)}
      </div>

      {uniqueModels.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-2">Унікальні обличчя</h3>
          <p className="text-sm text-gray-400 mb-4">
            Унікальні обличчя можуть використовуватись тільки одним живим персонажем. Після
            смерті персонажа обличчя стає доступним іншим гравцям.
          </p>
          {renderModelGrid(uniquePageModels, true)}
          {renderPagination(uniquePage, uniqueTotalPages, setUniquePage)}
        </div>
      )}
    </div>
  );
}
