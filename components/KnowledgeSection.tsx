import type { CSSProperties, ReactNode } from 'react';

const PILL_LINK_STYLE: CSSProperties = {
  fontSize: '14px',
  padding: '6px 12px',
  background: 'var(--bg-card)',
  border: '1px solid rgba(0,0,0,0.25)',
  borderRadius: '999px',
  color: 'var(--tx-2)',
  textDecoration: 'none',
};

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
    <section style={{ marginBottom: minimal ? '24px' : '32px' }}>
      <h2
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: '14px',
          color: 'var(--ac)',
          fontWeight: 600,
          letterSpacing: '0.2em',
          marginBottom: '12px',
        }}
      >
        <span style={{ width: '4px', height: '14px', background: 'var(--ac)', borderRadius: '2px' }} />
        {title}
      </h2>
      <div
        style={{
          background: gradient
            ? 'linear-gradient(135deg, rgba(0,0,0,0.12) 0%, rgba(0,0,0,0.04) 100%)'
            : 'white',
          border: '1px solid rgba(0,0,0,0.15)',
          borderRadius: '10px',
          padding: minimal ? '14px 18px' : '20px 22px',
        }}
      >
        {children}
      </div>
    </section>
  );
}

export function KnowledgeRichText({
  text,
  emphasizeBullets = false,
  muted = false,
  bodySize = '14px',
}: {
  text: string;
  emphasizeBullets?: boolean;
  muted?: boolean;
  bodySize?: '14px' | '15px';
}) {
  const normalized = text.replace(/\s·\s/g, '\n· ').trim();
  const lines = normalized.split('\n');

  return (
    <div
      style={{
        fontSize: bodySize,
        color: muted ? 'var(--tx-2)' : 'var(--tx-0)',
        lineHeight: 2,
        letterSpacing: '0.02em',
      }}
    >
      {lines.map((line, i) => {
        const trimmed = line.trim();
        if (!trimmed) return null;

        if (emphasizeBullets && trimmed.startsWith('·')) {
          const match = trimmed.match(/^·\s*(.+?)\s*(——|--)\s*(.*)$/);
          if (match) {
            return (
              <div key={i}>
                · <strong>{match[1]}</strong>
                {match[2]}
                {match[3]}
              </div>
            );
          }
        }

        return <div key={i}>{trimmed}</div>;
      })}
    </div>
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

export { PILL_LINK_STYLE };
