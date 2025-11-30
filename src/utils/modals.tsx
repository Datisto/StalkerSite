import { createRoot } from 'react-dom/client';
import { AlertModal, ConfirmModal, PromptModal } from '../components/Modal';

export function showAlert(
  message: string,
  title: string = 'Повідомлення',
  type: 'info' | 'success' | 'error' | 'warning' = 'info'
): Promise<void> {
  return new Promise((resolve) => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);

    const handleClose = () => {
      root.unmount();
      document.body.removeChild(container);
      resolve();
    };

    root.render(
      <AlertModal
        isOpen={true}
        onClose={handleClose}
        title={title}
        message={message}
        type={type}
      />
    );
  });
}

export function showConfirm(
  message: string,
  title: string = 'Підтвердження',
  options?: {
    confirmText?: string;
    cancelText?: string;
    type?: 'danger' | 'warning' | 'info';
  }
): Promise<boolean> {
  return new Promise((resolve) => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);

    const handleClose = (result: boolean) => {
      root.unmount();
      document.body.removeChild(container);
      resolve(result);
    };

    root.render(
      <ConfirmModal
        isOpen={true}
        onClose={() => handleClose(false)}
        onConfirm={() => handleClose(true)}
        title={title}
        message={message}
        confirmText={options?.confirmText}
        cancelText={options?.cancelText}
        type={options?.type || 'warning'}
      />
    );
  });
}

export function showPrompt(
  message: string,
  title: string = 'Введіть значення',
  options?: {
    placeholder?: string;
    defaultValue?: string;
    multiline?: boolean;
  }
): Promise<string | null> {
  return new Promise((resolve) => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);

    const handleClose = (result: string | null) => {
      root.unmount();
      document.body.removeChild(container);
      resolve(result);
    };

    root.render(
      <PromptModal
        isOpen={true}
        onClose={() => handleClose(null)}
        onSubmit={(value) => handleClose(value)}
        title={title}
        message={message}
        placeholder={options?.placeholder}
        defaultValue={options?.defaultValue}
        multiline={options?.multiline}
      />
    );
  });
}
