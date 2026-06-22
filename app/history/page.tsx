import Link from 'next/link';
import HistoryClient from './HistoryClient';
import { MembershipEditionButton } from '@/components/MembershipEditionButton';

export const metadata = {
  title: '历史命盘 · Metis',
  description: '查看本机保存的紫微命盘历史记录。',
};

export default function HistoryPage() {
  return (
    <div className="metis-history-page">
      <header className="metis-library-header">
        <Link className="metis-library-logo" aria-label="回到首页" href="/">
          METIS
        </Link>
        <nav className="metis-library-nav" aria-label="主导航">
          <Link className="obys-pill-link" href="/chart">起盘</Link>
          <span className="metis-library-nav-dot">·</span>
          <Link className="obys-pill-link" href="/heming">合盘</Link>
          <MembershipEditionButton variant="library" />
        </nav>
      </header>

      <main className="metis-history-main">
        <section className="metis-history-hero">
          <div className="metis-library-eyebrow">METIS · HISTORY</div>
          <h1>历史命盘</h1>
          <p>本地保存最近 10 条起盘记录。点击任意记录即可重新打开对应命盘。</p>
        </section>
        <HistoryClient />
      </main>
    </div>
  );
}
