import type { ReactNode } from 'react';

export function KnowledgeSection({
  title,
  children,
  gradient,
  minimal,
}: {
  title: string;
  children: ReactNode;
  gradient?: boolean;
  minimal?: boolean;
}) {
  return (
    <section style={{ marginBottom: minimal ? '24px' : '20px' }}>
      <h3
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: '14px',
          color: 'var(--ac)',
          fontWeight: 600,
          letterSpacing: '0.2em',
          marginBottom: '8px',
        }}
      >
        <span
          style={{
            width: '3px',
            height: '12px',
            background: 'var(--ac)',
            borderRadius: '2px',
            opacity: 0.7,
          }}
        />
        {title}
      </h3>
      <div
        style={{
          background: gradient
            ? 'linear-gradient(135deg, rgba(0,0,0,0.12) 0%, rgba(0,0,0,0.04) 100%)'
            : 'var(--bg-card)',
          border: '1px solid rgba(0,0,0,0.15)',
          borderRadius: gradient ? '10px' : '10px',
          padding: gradient ? '16px 20px' : '16px 20px',
        }}
      >
        {children}
      </div>
    </section>
  );
}

export function KnowledgeTopBar({
  backHref,
  backLabel,
  center,
  actionHref,
  actionLabel,
}: {
  backHref: string;
  backLabel: string;
  center: string;
  actionHref: string;
  actionLabel: string;
}) {
  return (
    <div
      className="px-6 py-4 flex items-center justify-between"
      style={{ borderBottom: '1px solid rgba(0,0,0,0.15)', background: 'var(--bg-page)' }}
    >
      <a
        href={backHref}
        style={{ fontSize: '14px', color: 'var(--ac)', letterSpacing: '0.3em', textDecoration: 'none' }}
      >
        {backLabel}
      </a>
      <div style={{ fontSize: '14px', color: 'var(--tx-3)', letterSpacing: '0.2em' }}>{center}</div>
      <a
        href={actionHref}
        style={{ fontSize: '14px', color: 'var(--ac)', letterSpacing: '0.2em', textDecoration: 'none' }}
      >
        {actionLabel}
      </a>
    </div>
  );
}

export function KnowledgeFooter() {
  return (
    <footer
      style={{
        borderTop: '1px solid rgba(0,0,0,0.15)',
        padding: '20px 24px',
        textAlign: 'center',
        fontSize: '14px',
        color: 'var(--tx-3)',
        letterSpacing: '0.1em',
      }}
    >
      <div style={{ marginBottom: '6px' }}>Metis · 基于倪海夏正宗体系 · 仅供学习参考</div>
      <div style={{ opacity: 0.85 }}>本平台不构成任何医疗、投资、法律或重大决策建议</div>
    </footer>
  );
}
