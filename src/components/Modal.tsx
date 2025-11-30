import { X } from 'lucide-react';
import { useEffect, useState } from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
}

export function Modal({ isOpen, onClose, title, children, size = 'md' }: ModalProps) {
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

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-2xl',
    lg: 'max-w-4xl'
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black bg-opacity-75 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className={`relative bg-gray-900 rounded-lg border border-gray-700 shadow-2xl w-full ${sizeClasses[size]} max-h-[90vh] overflow-auto`}>
        <div className="sticky top-0 bg-gray-900 border-b border-gray-700 px-6 py-4 flex items-center justify-between z-10">
          <h2 className="text-xl font-bold text-white">{title}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  );
}

interface AlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  type?: 'info' | 'success' | 'error' | 'warning';
}

export function AlertModal({ isOpen, onClose, title, message, type = 'info' }: AlertModalProps) {
  const typeColors = {
    info: 'border-blue-600 bg-blue-950',
    success: 'border-green-600 bg-green-950',
    error: 'border-red-600 bg-red-950',
    warning: 'border-yellow-600 bg-yellow-950'
  };

  const buttonColors = {
    info: 'bg-blue-600 hover:bg-blue-500',
    success: 'bg-green-600 hover:bg-green-500',
    error: 'bg-red-600 hover:bg-red-500',
    warning: 'bg-yellow-600 hover:bg-yellow-500'
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
      <div className={`p-4 rounded border ${typeColors[type]} mb-6`}>
        <p className="text-gray-100 whitespace-pre-wrap">{message}</p>
      </div>
      <div className="flex justify-end">
        <button
          onClick={onClose}
          className={`px-6 py-2 rounded font-semibold transition ${buttonColors[type]}`}
        >
          Зрозуміло
        </button>
      </div>
    </Modal>
  );
}

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info';
}

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Підтвердити',
  cancelText = 'Скасувати',
  type = 'warning'
}: ConfirmModalProps) {
  const typeColors = {
    danger: 'border-red-600 bg-red-950',
    warning: 'border-yellow-600 bg-yellow-950',
    info: 'border-blue-600 bg-blue-950'
  };

  const confirmButtonColors = {
    danger: 'bg-red-600 hover:bg-red-500',
    warning: 'bg-yellow-600 hover:bg-yellow-500',
    info: 'bg-blue-600 hover:bg-blue-500'
  };

  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
      <div className={`p-4 rounded border ${typeColors[type]} mb-6`}>
        <p className="text-gray-100 whitespace-pre-wrap">{message}</p>
      </div>
      <div className="flex justify-end gap-3">
        <button
          onClick={onClose}
          className="px-6 py-2 rounded font-semibold bg-gray-700 hover:bg-gray-600 transition"
        >
          {cancelText}
        </button>
        <button
          onClick={handleConfirm}
          className={`px-6 py-2 rounded font-semibold transition ${confirmButtonColors[type]}`}
        >
          {confirmText}
        </button>
      </div>
    </Modal>
  );
}

interface PromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (value: string) => void;
  title: string;
  message: string;
  placeholder?: string;
  defaultValue?: string;
  multiline?: boolean;
}

export function PromptModal({
  isOpen,
  onClose,
  onSubmit,
  title,
  message,
  placeholder = '',
  defaultValue = '',
  multiline = false
}: PromptModalProps) {
  const [value, setValue] = useState(defaultValue);

  useEffect(() => {
    if (isOpen) {
      setValue(defaultValue);
    }
  }, [isOpen, defaultValue]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (value.trim()) {
      onSubmit(value.trim());
      onClose();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
      <form onSubmit={handleSubmit}>
        <p className="text-gray-300 mb-4">{message}</p>
        {multiline ? (
          <textarea
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={placeholder}
            className="w-full bg-gray-800 border border-gray-700 rounded px-4 py-2 text-white focus:border-red-500 focus:outline-none min-h-[120px]"
            autoFocus
          />
        ) : (
          <input
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={placeholder}
            className="w-full bg-gray-800 border border-gray-700 rounded px-4 py-2 text-white focus:border-red-500 focus:outline-none"
            autoFocus
          />
        )}
        <div className="flex justify-end gap-3 mt-6">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2 rounded font-semibold bg-gray-700 hover:bg-gray-600 transition"
          >
            Скасувати
          </button>
          <button
            type="submit"
            disabled={!value.trim()}
            className="px-6 py-2 rounded font-semibold bg-red-600 hover:bg-red-500 disabled:bg-gray-700 disabled:cursor-not-allowed transition"
          >
            Підтвердити
          </button>
        </div>
      </form>
    </Modal>
  );
}

