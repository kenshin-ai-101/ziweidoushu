import { SanjiPage } from '@/components/OracleSubpage';
import { DIJI_MODULES } from '@/lib/nihai';
import Link from 'next/link';

export const metadata = {
  title: '地纪 · 倪海厦地理风水体系 · 国家地理志 / 堪舆 / 遗稿研读',
  description: '地纪下知地理，整理国家地理志、堪舆理论基础、遗稿与后学等模块。',
};

export default function Page() {
  return (
    <SanjiPage
      category="diji"
      modules={DIJI_MODULES}
      statLine="3 大模块 · 倪师未竟之业 · 国家地理志 / 堪舆理论 / 遗稿研读"
      sectionTitle="三大模块"
      sectionSubtitle="Di Ji · 3 Modules"
      quote={(
        <>
          倪师原计划 60 岁后专著《地纪》，以风水地理之眼解读国运兴衰。现存以<strong>九星派堪舆</strong>为主，后辈持续整理。
        </>
      )}
      quoteFrom="峦头是骨架，理气是脉络——形气兼顾，缺一不可。"
      quoteSource="堪舆总论"
    >
      <div className="oracle-inline-links">
        <div className="oracle-sanity-nav">
          <Link href="/library/zangshu">《葬书》<span>地纪经典 →</span></Link>
          <Link href="/library/qingnangjing">《青囊经》<span>理气总纲 →</span></Link>
        </div>
      </div>
    </SanjiPage>
  );
}
