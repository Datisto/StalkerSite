import { useState, useCallback } from 'react';

export function useModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [resolvePromise, setResolvePromise] = useState<((value: boolean) => void) | null>(null);

  const open = useCallback(() => {
    setIsOpen(true);
    return new Promise<boolean>((resolve) => {
      setResolvePromise(() => resolve);
    });
  }, []);

  const close = useCallback((value: boolean = false) => {
    setIsOpen(false);
    if (resolvePromise) {
      resolvePromise(value);
      setResolvePromise(null);
    }
  }, [resolvePromise]);

  return { isOpen, open, close };
}

export function useAlertModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [config, setConfig] = useState<{
    title: string;
    message: string;
    type: 'info' | 'success' | 'error' | 'warning';
  }>({ title: '', message: '', type: 'info' });

  const showAlert = useCallback((
    message: string,
    title: string = 'Повідомлення',
    type: 'info' | 'success' | 'error' | 'warning' = 'info'
  ) => {
    setConfig({ title, message, type });
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
  }, []);

  return { isOpen, config, showAlert, close };
}

export function useConfirmModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [config, setConfig] = useState<{
    title: string;
    message: string;
    confirmText: string;
    cancelText: string;
    type: 'danger' | 'warning' | 'info';
  }>({
    title: '',
    message: '',
    confirmText: 'Підтвердити',
    cancelText: 'Скасувати',
    type: 'warning'
  });
  const [resolvePromise, setResolvePromise] = useState<((value: boolean) => void) | null>(null);

  const showConfirm = useCallback((
    message: string,
    title: string = 'Підтвердження',
    options?: {
      confirmText?: string;
      cancelText?: string;
      type?: 'danger' | 'warning' | 'info';
    }
  ) => {
    setConfig({
      title,
      message,
      confirmText: options?.confirmText || 'Підтвердити',
      cancelText: options?.cancelText || 'Скасувати',
      type: options?.type || 'warning'
    });
    setIsOpen(true);
    return new Promise<boolean>((resolve) => {
      setResolvePromise(() => resolve);
    });
  }, []);

  const handleConfirm = useCallback(() => {
    setIsOpen(false);
    if (resolvePromise) {
      resolvePromise(true);
      setResolvePromise(null);
    }
  }, [resolvePromise]);

  const handleCancel = useCallback(() => {
    setIsOpen(false);
    if (resolvePromise) {
      resolvePromise(false);
      setResolvePromise(null);
    }
  }, [resolvePromise]);

  return { isOpen, config, showConfirm, handleConfirm, handleCancel };
}

export function usePromptModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [config, setConfig] = useState<{
    title: string;
    message: string;
    placeholder: string;
    defaultValue: string;
    multiline: boolean;
  }>({
    title: '',
    message: '',
    placeholder: '',
    defaultValue: '',
    multiline: false
  });
  const [resolvePromise, setResolvePromise] = useState<((value: string | null) => void) | null>(null);

  const showPrompt = useCallback((
    message: string,
    title: string = 'Введіть значення',
    options?: {
      placeholder?: string;
      defaultValue?: string;
      multiline?: boolean;
    }
  ) => {
    setConfig({
      title,
      message,
      placeholder: options?.placeholder || '',
      defaultValue: options?.defaultValue || '',
      multiline: options?.multiline || false
    });
    setIsOpen(true);
    return new Promise<string | null>((resolve) => {
      setResolvePromise(() => resolve);
    });
  }, []);

  const handleSubmit = useCallback((value: string) => {
    setIsOpen(false);
    if (resolvePromise) {
      resolvePromise(value);
      setResolvePromise(null);
    }
  }, [resolvePromise]);

  const handleCancel = useCallback(() => {
    setIsOpen(false);
    if (resolvePromise) {
      resolvePromise(null);
      setResolvePromise(null);
    }
  }, [resolvePromise]);

  return { isOpen, config, showPrompt, handleSubmit, handleCancel };
}
