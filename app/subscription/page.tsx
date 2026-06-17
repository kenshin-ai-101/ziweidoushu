import Link from 'next/link';

type SubscriptionSearchParams = {
  redirect?: string;
};

export const metadata = {
  title: '模拟开通专业版 · Metis',
  description: '本地开发用的专业版仿真开通页。',
};

function getSafeRedirect(value?: string) {
  if (!value || !value.startsWith('/') || value.startsWith('//')) return '/library';
  return value;
}

function withMockProParam(path: string) {
  return `${path}${path.includes('?') ? '&' : '?'}pro=1`;
}

export default async function SubscriptionPage({
  searchParams,
}: {
  searchParams?: Promise<SubscriptionSearchParams>;
}) {
  const query = await searchParams;
  const redirect = getSafeRedirect(query?.redirect);
  const unlockedHref = withMockProParam(redirect);

  return (
    <div id="main-content" style={{ background: 'var(--bg-page)', minHeight: '100vh' }}>
      <header
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 100,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          padding: 'clamp(14px, 2vw, 24px) clamp(16px, 3vw, 32px)',
          pointerEvents: 'none',
        }}
      >
        <Link
          aria-label="回到首页"
          href="/"
          style={{
            pointerEvents: 'auto',
            color: '#000',
            fontSize: 'clamp(26px, 3vw, 42px)',
            lineHeight: 1,
            fontWeight: 900,
            letterSpacing: '-0.02em',
            textDecoration: 'none',
          }}
        >
          METIS
        </Link>
        <div style={{ pointerEvents: 'auto', display: 'flex', alignItems: 'center', gap: 'clamp(2px, 0.4vw, 6px)' }}>
          <Link className="obys-pill-link" style={{ fontSize: 'clamp(11px, 1.1vw, 13px)', padding: 'clamp(3px, 0.4vw, 4px) clamp(6px, 1vw, 10px)' }} href="/chart">
            起盘
          </Link>
          <span style={{ color: '#d4d4d4', fontSize: 'var(--fs-10)' }}>·</span>
          <Link className="obys-pill-link" style={{ fontSize: 'clamp(11px, 1.1vw, 13px)', padding: 'clamp(3px, 0.4vw, 4px) clamp(6px, 1vw, 10px)' }} href="/heming">
            合盘
          </Link>
          <button
            type="button"
            className="obys-btn obys-btn--primary"
            style={{
              fontSize: 'clamp(11px, 1.1vw, 13px)',
              padding: 'clamp(4px, 0.5vw, 5px) clamp(10px, 1.2vw, 14px)',
              marginLeft: 'clamp(4px, 0.6vw, 8px)',
              background: '#fff',
              color: '#1a1a1a',
              borderColor: 'rgba(0,0,0,0.28)',
              fontWeight: 500,
            }}
          >
            普通版
          </button>
        </div>
      </header>

      <main style={{ maxWidth: 680, margin: '0 auto', padding: 'clamp(120px,18vh,180px) 24px 96px', textAlign: 'center' }}>
        <div style={{ fontSize: 12, letterSpacing: '0.3em', color: '#6b6b6b', marginBottom: 14 }}>
          MOCK CHECKOUT
        </div>
        <h1 style={{ fontSize: 'clamp(28px,4vw,42px)', fontWeight: 850, color: '#000', margin: '0 0 18px', letterSpacing: '0.02em' }}>
          模拟开通专业版
        </h1>
        <p style={{ maxWidth: 560, margin: '0 auto 30px', color: '#555', fontSize: 15, lineHeight: 2 }}>
          这里暂不接入真实支付。开发阶段通过 URL 参数控制会员状态：
          <br />
          点击下方按钮后会跳回目标页面，并附加 <code style={{ color: '#000' }}>?pro=1</code>。
        </p>

        <div style={{ display: 'grid', gap: 12, maxWidth: 420, margin: '0 auto 24px' }}>
          <Link
            href={unlockedHref}
            style={{
              padding: '14px 34px',
              borderRadius: 28,
              background: '#000',
              color: '#fff',
              fontSize: 15,
              fontWeight: 650,
              textDecoration: 'none',
              letterSpacing: '0.04em',
            }}
          >
            模拟支付成功并开通 →
          </Link>
          <Link
            href={redirect}
            style={{
              padding: '13px 34px',
              borderRadius: 28,
              border: '1px solid #ccc',
              color: '#333',
              fontSize: 15,
              textDecoration: 'none',
              letterSpacing: '0.04em',
            }}
          >
            取消，返回锁定页
          </Link>
        </div>

        <p style={{ color: '#8a8a8a', fontSize: 12, lineHeight: 1.8, letterSpacing: '0.06em' }}>
          也可以手动访问任意古籍页并加上参数，例如 /library/gusuifu?pro=1。
        </p>
      </main>
    </div>
  );
}
