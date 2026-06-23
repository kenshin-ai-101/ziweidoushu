'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

interface RightDrawerProps {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  width?: number;
  children: ReactNode;
  footer?: ReactNode;
  footerClassName?: string;
}

export default function RightDrawer({
  open,
  onClose,
  title,
  subtitle,
  width = 440,
  children,
  footer,
  footerClassName,
}: RightDrawerProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  if (!mounted || !open) return null;

  return createPortal(
    <>
      <div
        className="chart-drawer-backdrop"
        onClick={onClose}
        aria-hidden
      />
      <aside
        className="chart-right-drawer"
        role="dialog"
        aria-modal="true"
        aria-labelledby="right-drawer-title"
        style={{ width: `min(${width}px, 100vw)` }}
      >
        <div className="chart-right-drawer-head">
          <div>
            <h3 id="right-drawer-title">{title}</h3>
            {subtitle && <p>{subtitle}</p>}
          </div>
          <button type="button" onClick={onClose} aria-label="关闭">
            ✕
          </button>
        </div>
        <div className={`chart-right-drawer-body${footer ? ' has-footer' : ''}`}>
          {children}
        </div>
        {footer && (
          <div className={['chart-right-drawer-footer', footerClassName].filter(Boolean).join(' ')}>
            {footer}
          </div>
        )}
      </aside>
    </>,
    document.body,
  );
}
