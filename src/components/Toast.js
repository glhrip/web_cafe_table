'use client';

import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import Icon from './Icon';

const ToastCtx = createContext(() => {});

export function useToast() {
  return useContext(ToastCtx);
}

const ICONS = { success: 'check', error: 'alert', info: 'sparkles' };

/** Provider notifikasi ringan (pojok kanan atas). */
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const push = useCallback((message, type = 'info') => {
    const id = Math.random().toString(36).slice(2);
    setToasts((t) => [...t, { id, message, type }]);
    setTimeout(() => {
      setToasts((t) => t.filter((x) => x.id !== id));
    }, 3200);
  }, []);

  const api = useMemo(() => Object.assign(push, {
    success: (m) => push(m, 'success'),
    error: (m) => push(m, 'error'),
    info: (m) => push(m, 'info'),
  }), [push]);

  return (
    <ToastCtx.Provider value={api}>
      {children}
      <div
        style={{
          position: 'fixed',
          top: 14,
          right: 14,
          zIndex: 100,
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
          pointerEvents: 'none',
        }}
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`badge badge-${
              t.type === 'success'
                ? 'success'
                : t.type === 'error'
                ? 'danger'
                : 'info'
            }`}
            style={{
              padding: '12px 16px',
              fontSize: '0.88rem',
              boxShadow: 'var(--shadow-md)',
              animation: 'fadeUp 0.3s ease both',
              maxWidth: 320,
              whiteSpace: 'normal',
            }}
          >
            <Icon name={ICONS[t.type] || 'sparkles'} size={16} />
            <span style={{ fontWeight: 600 }}>{t.message}</span>
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}
