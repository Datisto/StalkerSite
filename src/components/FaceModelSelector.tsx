import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { CheckCircle } from 'lucide-react';

interface FaceModel {
  id: string;
  name: string;
  image_url: string;
  is_unique: boolean;
  display_order: number;
}

interface FaceModelSelectorProps {
  selectedModel: string;
  onSelect: (modelName: string) => void;
  currentCharacterId?: string;
}

export default function FaceModelSelector({
  selectedModel,
  onSelect,
  currentCharacterId,
}: FaceModelSelectorProps) {
  const [faceModels, setFaceModels] = useState<FaceModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [unavailableModels, setUnavailableModels] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadFaceModels();
  }, [currentCharacterId]);

  async function loadFaceModels() {
    setLoading(true);
    try {
      const { data: models, error: modelsError } = await supabase
        .from('face_models')
        .select('*')
        .eq('is_active', true)
        .order('display_order');

      if (modelsError) throw modelsError;

      const { data: usedFaces, error: usedError } = await supabase
        .from('characters')
        .select('face_model')
        .eq('is_dead', false)
        .in('status', ['approved', 'active']);

      if (usedError) throw usedError;

      const uniqueModels = models?.filter((m) => m.is_unique) || [];
      const usedUniqueFaces = new Set(
        usedFaces
          ?.map((c) => c.face_model)
          .filter((fm) => uniqueModels.some((um) => um.name === fm)) || []
      );

      if (currentCharacterId) {
        const { data: currentChar } = await supabase
          .from('characters')
          .select('face_model')
          .eq('id', currentCharacterId)
          .maybeSingle();

        if (currentChar?.face_model) {
          usedUniqueFaces.delete(currentChar.face_model);
        }
      }

      setUnavailableModels(usedUniqueFaces);
      setFaceModels(models || []);
    } catch (error) {
      console.error('Error loading face models:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-400">Завантаження моделей...</p>
      </div>
    );
  }

  const regularModels = faceModels.filter((m) => !m.is_unique);
  const uniqueModels = faceModels.filter((m) => m.is_unique);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Стандартні моделі</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {regularModels.map((model) => {
            const isSelected = selectedModel === model.name;
            return (
              <button
                key={model.id}
                type="button"
                onClick={() => onSelect(model.name)}
                className={`relative rounded-lg overflow-hidden border-2 transition-all ${
                  isSelected
                    ? 'border-red-500 ring-2 ring-red-500 ring-opacity-50'
                    : 'border-gray-700 hover:border-gray-500'
                }`}
              >
                <img
                  src={model.image_url}
                  alt={model.name}
                  className="w-full aspect-square object-cover"
                />
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-2">
                  <p className="text-sm font-medium text-white text-center">{model.name}</p>
                </div>
                {isSelected && (
                  <div className="absolute top-2 right-2 bg-red-500 rounded-full p-1">
                    <CheckCircle className="w-5 h-5 text-white" />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {uniqueModels.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-2">Унікальні обличчя</h3>
          <p className="text-sm text-gray-400 mb-4">
            Унікальні обличчя можуть використовуватись тільки одним живим персонажем. Після
            смерті персонажа обличчя стає доступним іншим гравцям.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {uniqueModels.map((model) => {
              const isSelected = selectedModel === model.name;
              const isUnavailable = unavailableModels.has(model.name);
              return (
                <button
                  key={model.id}
                  type="button"
                  onClick={() => !isUnavailable && onSelect(model.name)}
                  disabled={isUnavailable}
                  className={`relative rounded-lg overflow-hidden border-2 transition-all ${
                    isUnavailable
                      ? 'border-gray-800 opacity-50 cursor-not-allowed'
                      : isSelected
                      ? 'border-red-500 ring-2 ring-red-500 ring-opacity-50'
                      : 'border-red-900 hover:border-red-700'
                  }`}
                >
                  <img
                    src={model.image_url}
                    alt={model.name}
                    className={`w-full aspect-square object-cover ${
                      isUnavailable ? 'grayscale' : ''
                    }`}
                  />
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-2">
                    <p className="text-sm font-medium text-white text-center">{model.name}</p>
                    {isUnavailable && (
                      <p className="text-xs text-red-400 text-center mt-1">Зайнято</p>
                    )}
                  </div>
                  {isSelected && (
                    <div className="absolute top-2 right-2 bg-red-500 rounded-full p-1">
                      <CheckCircle className="w-5 h-5 text-white" />
                    </div>
                  )}
                  {model.is_unique && !isUnavailable && (
                    <div className="absolute top-2 left-2 bg-red-600 text-white text-xs px-2 py-1 rounded">
                      Унікальне
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
