import React from 'react';
import useUiStore from '../../store/uiStore';
import './Toast.css';

export default function ToastContainer() {
  const { toasts, removeToast } = useUiStore();

  if (toasts.length === 0) return null;

  return (
    <div className="toast-container">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`toast-item toast-${toast.type}`}
          onClick={() => removeToast(toast.id)}
        >
          <div className="toast-content">
            {toast.title && <h4 className="toast-title">{toast.title}</h4>}
            <p className="toast-message">{toast.message}</p>
          </div>
          <button className="toast-close-btn">&times;</button>
        </div>
      ))}
    </div>
  );
}
