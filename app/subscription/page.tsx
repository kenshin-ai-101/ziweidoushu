import { Suspense } from 'react';
import SubscriptionPageClient from './SubscriptionPageClient';

export const metadata = {
  title: '专业版 · Metis',
  description: 'Metis 专业版订阅 — 解锁全部宫位解读、流月流日流时、古籍库与更高 AI 额度。',
};

export default function SubscriptionPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', background: 'var(--bg-page)' }} />}>
      <SubscriptionPageClient />
    </Suspense>
  );
}
