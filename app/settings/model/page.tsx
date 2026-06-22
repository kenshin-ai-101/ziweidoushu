import Link from 'next/link';

export const metadata = {
  title: 'AI 模型设置 · Metis',
  description: '配置自有大模型 API（专业版）。',
  robots: { index: false, follow: false },
};

export default function ModelSettingsPage() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-0)', color: 'var(--tx-1)', fontFamily: 'var(--font-sans)' }}>
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '18px 24px',
          borderBottom: '1px solid var(--bdr)',
        }}
      >
        <Link href="/" style={{ fontWeight: 800, fontSize: 20, letterSpacing: '-0.02em', color: 'inherit', textDecoration: 'none' }}>
          METIS
        </Link>
        <Link href="/account" style={{ fontSize: 13, color: 'var(--tx-2)', textDecoration: 'none' }}>
          ← 返回账户
        </Link>
      </header>
      <main style={{ maxWidth: 560, margin: '0 auto', padding: '40px 20px 80px' }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, marginBottom: 16 }}>接入自有模型 API</h1>
        <p style={{ color: 'var(--tx-2)', fontSize: 14, lineHeight: 1.8 }}>
          本地开发环境暂未接入 BYOK 配置存储。生产环境在此页填写 OpenAI 兼容端点与 API Key 后，命盘解读将走自有模型且不占平台每日额度。
        </p>
      </main>
    </div>
  );
}
