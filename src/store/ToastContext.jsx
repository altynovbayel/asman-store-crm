/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useCallback } from 'react';
import ToastContainer from '../components/Toast/ToastContainer';

export const ToastContext = createContext(null);

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prevToasts) => prevToasts.filter((toast) => toast.id !== id));
  }, []);

  const addToast = useCallback((type, message, duration = 4000) => {
    const id = Date.now() + Math.random().toString(36).substr(2, 9);
    setToasts((prevToasts) => [...prevToasts, { id, type, message }]);

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
  }, [removeToast]);

  const showSuccess = useCallback((message, duration) => addToast('success', message, duration), [addToast]);
  const showError = useCallback((message, duration) => addToast('error', message, duration), [addToast]);
  const showWarning = useCallback((message, duration) => addToast('warning', message, duration), [addToast]);
  const showInfo = useCallback((message, duration) => addToast('info', message, duration), [addToast]);

  const value = {
    showSuccess,
    showError,
    showWarning,
    showInfo,
    removeToast,
    toasts
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
export default ToastContext;
