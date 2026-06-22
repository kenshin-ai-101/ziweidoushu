'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

export function showOracleToast(message: string) {
  window.dispatchEvent(new CustomEvent('oracle:toast', { detail: { message } }));
}

export default function OracleToast() {
  const [mounted, setMounted] = useState(false);
  const [toast, setToast] = useState<{ msg: string; key: number } | null>(null);
  const [phase, setPhase] = useState<'in' | 'out'>('in');

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const onToast = (event: Event) => {
      const message = (event as CustomEvent<{ message?: string }>).detail?.message;
      if (!message) return;
      setToast({ msg: message, key: Date.now() });
      setPhase('in');
    };
    window.addEventListener('oracle:toast', onToast);
    return () => window.removeEventListener('oracle:toast', onToast);
  }, []);

  useEffect(() => {
    if (!toast) return;
    const hide = window.setTimeout(() => setPhase('out'), 2000);
    const clear = window.setTimeout(() => setToast(null), 2520);
    return () => {
      window.clearTimeout(hide);
      window.clearTimeout(clear);
    };
  }, [toast?.key, toast]);

  if (!mounted || !toast) return null;

  return createPortal(
    <div
      aria-live="polite"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 10001,
        display: 'flex',
        justifyContent: 'center',
        pointerEvents: 'none',
        paddingTop: 26,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '13px 22px 13px 15px',
          background: '#fff',
          borderRadius: 999,
          boxShadow: '0 12px 42px rgba(0,0,0,0.17)',
          border: '1px solid rgba(0,0,0,0.05)',
          animation: phase === 'in'
            ? 'oracleToastIn 0.55s cubic-bezier(0.34,1.56,0.64,1) both'
            : 'oracleToastOut 0.5s cubic-bezier(0.45,0,0.7,1) both',
        }}
      >
        <span
          style={{
            width: 26,
            height: 26,
            borderRadius: '50%',
            background: '#22a06b',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontSize: 15,
            fontWeight: 700,
            flexShrink: 0,
          }}
        >
          ✓
        </span>
        <span style={{ fontSize: 14.5, fontWeight: 600, color: '#1a1a1a', whiteSpace: 'nowrap' }}>
          {toast.msg}
        </span>
      </div>
      <style>{`
        @keyframes oracleToastIn {
          0% { transform: translateY(-90px) scale(0.85); opacity: 0; }
          55% { transform: translateY(10px) scale(1.03); opacity: 1; }
          100% { transform: translateY(0) scale(1); opacity: 1; }
        }
        @keyframes oracleToastOut {
          0% { transform: translateY(0) scale(1); opacity: 1; }
          22% { transform: translateY(7px) scale(1.02); opacity: 1; }
          100% { transform: translateY(-96px) scale(0.8); opacity: 0; }
        }
      `}</style>
    </div>,
    document.body,
  );
}
