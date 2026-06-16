'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import BirthForm from '@/components/BirthForm';
import ChartBoard from '@/components/ChartBoard';
import InsightPanel from '@/components/InsightPanel';
import type { NiModule, SanJiCategory } from '@/lib/nihai';
import { SANJI_CATEGORIES } from '@/lib/nihai';
import { generateChart } from '@/lib/ziwei/algorithm';
import type { Palace, ZiweiChart } from '@/lib/ziwei/types';

type ShellTone = 'gold' | 'green' | 'violet' | 'ink';

const toneColor: Record<ShellTone, string> = {
  gold: '#b8922a',
  green: '#5f7f55',
  violet: '#7d6694',
  ink: '#111111',
};

const productionChapterLabels: Record<string, Record<string, string>> = {
  tianji: {
    ziwei: '4 章节 · 三合派',
    yijing: '9 章节 · 象数派',
    kanyu: '8 章节 · 九星派（杨救贫流派）',
    tuiming: '10 章节 · 河洛数理派',
    mianxiang: '14 章节 · 五形面相',
    tianxiang: '7 章节',
    cezi: '6 章节 · 传统测字',
    liuren: '9 章节',
  },
  diji: {
    geography: '6 章节 · 进入学科 →',
    'kanyu-theory': '7 章节 · 进入学科 →',
    legacy: '5 章节 · 进入学科 →',
  },
  renji: {
    zhenjiu: '7 章节 · 进入学科 →',
    neijing: '7 章节 · 进入学科 →',
    bencao: '7 章节 · 进入学科 →',
    shanghan: '7 章节 · 进入学科 →',
    jingui: '7 章节 · 进入学科 →',
  },
};

const productionCardCopy: Record<string, Record<string, { pre?: string; subtitle: string }>> = {
  tianji: {
    ziwei: { subtitle: '学习命盘星曜宫位体系架构\n三合派 · 倪师正宗体系' },
    yijing: { subtitle: '易经卦象与事物关系的文化研读\n象数派 · 断易天机' },
    kanyu: { subtitle: '风水堪舆理论与空间营造原理研读\n九星派 · 杨救贫流派' },
    tuiming: { subtitle: '数字学与易学理论的传统应用研究\n河洛数理派 · 子平法' },
    mianxiang: { subtitle: '面相学特征识别与传统人文学原理\n五形论 · 命相同参' },
    tianxiang: { subtitle: '天文现象与古代历法体系研究' },
    cezi: { subtitle: '字理文化与汉字形义的学问研读' },
    liuren: { subtitle: '六壬学传统应用的知识体系' },
  },
  diji: {
    geography: { subtitle: '以风水读懂一国的命运' },
    'kanyu-theory': { subtitle: '理气与峦头的根基' },
    legacy: { subtitle: '薪火相传 · 后人补注' },
  },
  renji: {
    zhenjiu: { pre: '第 1 课', subtitle: '经络穴位 · 入门第一课' },
    neijing: { pre: '第 2 课', subtitle: '中医理论 · 思维根基' },
    bencao: { pre: '第 3 课', subtitle: '药物学 · 记住每味药的脾性' },
    shanghan: { pre: '第 4 课', subtitle: '辨证论治 · 真正治病的方法' },
    jingui: { pre: '第 5 课', subtitle: '杂病诊治 · 实战集大成' },
  },
};

export function OracleChrome({
  children,
  tone = 'gold',
  compact = false,
  variant,
}: {
  children: React.ReactNode;
  tone?: ShellTone;
  compact?: boolean;
  variant?: 'chart' | 'terms';
}) {
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', 'light');
    document.documentElement.style.background = '#fafafa';
    document.body.style.background = '#fafafa';
    window.dispatchEvent(new CustomEvent('ziwei-force-theme', { detail: 'light' }));
  }, []);

  return (
    <main className={`oracle-subpage oracle-subpage--${tone} ${compact ? 'oracle-subpage--compact' : ''} ${variant ? `oracle-subpage--${variant}` : ''}`}>
      <header className="oracle-subpage-header">
        <Link className="oracle-subpage-logo" href="/">ORACLE</Link>
        <nav className="oracle-subpage-actions" aria-label="主导航">
          <Link href="/chart">起盘</Link>
          <span>·</span>
          <Link href="/heming">合盘</Link>
          <button type="button">专业版</button>
        </nav>
      </header>
      {children}
      <OracleFooter />
    </main>
  );
}

export function OracleHero({
  eyebrow,
  title,
  subtitle,
  description,
  stats,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
  description: string;
  stats?: string;
}) {
  return (
    <section className="oracle-subpage-hero">
      <span>{eyebrow}</span>
      <h1>{title}</h1>
      <p className="oracle-subpage-subtitle">{subtitle}</p>
      <p className="oracle-subpage-description">{description}</p>
      {stats && <div className="oracle-subpage-stats">{stats}</div>}
    </section>
  );
}

export function OracleFooter() {
  return (
    <footer className="oracle-subpage-footer">
      <div className="oracle-subpage-footer-row">
        <Link href="/privacy">隐私政策</Link>
        <span>·</span>
        <Link href="/terms">服务条款</Link>
        <span>·</span>
        <a href="mailto:feedback@wdyziweidoushu666.com?subject=违法和不良信息举报">违法和不良信息举报</a>
        <span>·</span>
        <a href="https://www.12377.cn/" target="_blank" rel="noopener noreferrer">12377 举报</a>
      </div>
      <p>本平台基于中国传统文化研究，仅供学习参考，不构成医疗、投资、婚姻、法律或重大决策建议。AI 输出非医疗诊断。</p>
      <div className="oracle-subpage-footer-row">
        <a href="https://beian.miit.gov.cn/" target="_blank" rel="noopener noreferrer">京ICP备2026027116号</a>
        <span>·</span>
        <a href="http://www.beian.gov.cn/portal/registerSystemInfo" target="_blank" rel="noopener noreferrer">京公网安备11010502061088号</a>
        <span>·</span>
        <em>©2026 Oracle</em>
      </div>
      <p>主办主体：两江新区旺多鱼网络科技工作室（个体工商户） · 客服：wdy778@outlook.com</p>
    </footer>
  );
}

export function SectionTitle({
  index,
  title,
  subtitle,
  action,
}: {
  index: string;
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="oracle-section-title">
      <div>
        <span>{index}</span>
        <h2>{title}</h2>
        {subtitle && <p>{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function SanjiPage({
  category,
  modules,
  quote,
  quoteFrom,
  intro,
  statLine,
  sectionTitle,
  sectionSubtitle,
  children,
}: {
  category: SanJiCategory;
  modules: NiModule[];
  quote: string;
  quoteFrom: string;
  intro: string;
  statLine: string;
  sectionTitle: string;
  sectionSubtitle: string;
  children?: React.ReactNode;
}) {
  const config = SANJI_CATEGORIES.find(item => item.key === category) ?? SANJI_CATEGORIES[0];
  const tone = category === 'diji' ? 'green' : category === 'renji' ? 'violet' : 'gold';

  return (
    <OracleChrome tone={tone}>
      <OracleHero
        eyebrow={`NI HAI XIA · ${config.nameEn.toUpperCase().replace(' ', ' ')}`}
        title={config.name}
        subtitle={config.meaning}
        description={intro}
        stats={statLine}
      />

      <section className="oracle-content-band">
        <SectionTitle index="01" title={sectionTitle} subtitle={sectionSubtitle} />
        <div className="oracle-module-rail" aria-label={sectionTitle}>
          {modules.map(module => (
            <Link
              key={module.id}
              className="oracle-module-card"
              href={module.slug === 'ziwei' ? '/knowledge' : '#'}
            >
              <span className="oracle-module-status">LIVE</span>
              {productionCardCopy[category]?.[module.slug]?.pre && (
                <em>{productionCardCopy[category][module.slug].pre}</em>
              )}
              <strong>{module.nameEn}</strong>
              <b>{module.name}</b>
              <p>{productionCardCopy[category]?.[module.slug]?.subtitle ?? module.subtitle}</p>
              <small>{productionChapterLabels[category]?.[module.slug] ?? `${module.chapters.length} 章节${module.school ? ` · ${module.school}` : ' · 进入学科 →'}`}</small>
            </Link>
          ))}
        </div>
        <p className="oracle-scroll-hint">← 横向滑动浏览全部学科 →</p>
      </section>

      <section className="oracle-content-band">
        <SectionTitle index="02" title="倪师一言" />
        <div className="oracle-quote-panel">
          <p>{quote}</p>
          <blockquote>「{quoteFrom}」</blockquote>
        </div>
        {children}
        <div className="oracle-sanity-nav">
          {SANJI_CATEGORIES.map(item => (
            <Link key={item.key} href={item.href} className={item.key === category ? 'is-active' : ''}>
              {item.name}<span>{item.meaning}</span>
            </Link>
          ))}
        </div>
        <Link className="oracle-back-home" href="/">← 返回首页</Link>
      </section>
    </OracleChrome>
  );
}

export function TwinsPage() {
  return (
    <OracleChrome tone="ink">
      <OracleHero
        eyebrow="02 / DESTINY TWINS"
        title="命运双胞胎"
        subtitle="Destiny Twins"
        description="分析命盘配置 —— 查询与您星曜宫位相同的命理学样本群体。数据分析工具，供学术研究与文化参考。"
      />

      <section className="oracle-content-band">
        <SectionTitle index="INPUT" title="输入你的出生信息" subtitle="填出生地以校正真太阳时，时辰差一格，整张盘和双胞胎都会变。" />
        <div className="oracle-form-grid oracle-form-grid--centered">
          <div className="oracle-form-card">
            <BirthForm
              onSubmit={() => {
                window.location.href = '/chart';
              }}
            />
          </div>
        </div>
      </section>

      <section className="oracle-content-band">
        <SectionTitle index="01" title="配对维度" subtitle="3 个独立变量 — 严格意义的命运双胞胎" />
        <div className="oracle-research-grid">
          {[
            ['01', '公历出生日期', '年、月、日精确到 1 天'],
            ['02', '真太阳时辰', '120 分钟分辨率，已含经纬度校正'],
            ['03', '性别', '男 / 女'],
          ].map(item => (
            <article key={item[0]}>
              <span>{item[0]}</span>
              <h3>{item[1]}</h3>
              <p>{item[2]}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="oracle-content-band">
        <SectionTitle index="02" title="不参与配对" subtitle="What's NOT in the match key" />
        <div className="oracle-panel">
          <ul className="oracle-check-list">
            <li>出生地：经纬度只是算真太阳时的中间变量，不参与配对。</li>
            <li>城市、行政区：地理差异是后续解读维度，不是排除条件。</li>
            <li>具体分钟数：120 分钟时辰窗口内任何分钟都算同一时辰。</li>
          </ul>
          <p>张三在北京 8:00 出生和李四在乌鲁木齐 9:10 出生，只要真太阳时同落「辰时」，两人本命盘、大限、流年、流月、流日、流时全部相同。</p>
        </div>
      </section>

      <section className="oracle-content-band">
        <SectionTitle index="03" title="功能路线图" subtitle="4 个层次的能力，01-03 已就绪，04 筹备中" />
        <div className="oracle-roadmap">
          {[
            ['01', '严格匹配 + 人数估算', '同 key 即同盘，无需 AI；按出生年人口给出全国估算。'],
            ['02', '出生地时间窗', '逐城反推你的双胞胎在当地什么钟表时间出生。'],
            ['03', '结构双子星 Top20', '在 67.5 万张命盘中检索结构最相近的盘。'],
            ['04', '人生时间线对照', '把双子星盘的大限运程逐段并排，做预演式参考。'],
          ].map(item => (
            <article key={item[0]}>
              <span>{item[0]}</span>
              <h3>{item[1]}</h3>
              <p>{item[2]}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="oracle-content-band">
        <SectionTitle index="04" title="数据规模" subtitle="67.5 万独立命盘 · 1950–2026 全覆盖" />
        <div className="oracle-kpi-row oracle-kpi-row--large">
          <strong>67.5w<small>独立命盘配置</small></strong>
          <strong>13 维<small>每盘解读维度</small></strong>
          <strong>877w<small>解读文案条数</small></strong>
          <strong>77 年<small>覆盖 1950–2026</small></strong>
        </div>
        <p className="oracle-note-text">「877w」指 67.5 万独立命盘 × 13 个解读维度的解读文案总量，并非真人数量。命运双胞胎的真人地理分布功能正在筹备中。</p>
        <div className="oracle-sanity-nav oracle-sanity-nav--cta">
          <Link href="/chart">先去起盘 →<span>生成你的命盘与指纹</span></Link>
          <Link href="/chart">专业版 →<span>逐维深度解读</span></Link>
          <Link href="/academy">学术中心 →<span>命格相同 ≠ 命运相同的学理</span></Link>
        </div>
        <Link className="oracle-back-home" href="/">← 返回首页</Link>
      </section>
    </OracleChrome>
  );
}

export function ChartOraclePage() {
  const [chart, setChart] = useState<ZiweiChart | null>(null);
  const [selectedPalace, setSelectedPalace] = useState<Palace | null>(null);

  if (chart) {
    return (
      <OracleChrome tone="gold" compact>
        <section className="oracle-chart-workspace">
          <div>
            <button className="oracle-back-home" type="button" onClick={() => { setChart(null); setSelectedPalace(null); }}>
              ← 重新起盘
            </button>
            <ChartBoard chart={chart} onPalaceSelect={setSelectedPalace} />
          </div>
          <InsightPanel chart={chart} selectedPalace={selectedPalace} />
        </section>
      </OracleChrome>
    );
  }

  return (
    <OracleChrome tone="gold" variant="chart">
      <OracleHero
        eyebrow="01 / DESTINY ENGINE"
        title="起紫微命盘"
        subtitle="Destiny Intelligence Engine"
        description="输入出生年月日时 · 以公历为准"
      />
      <section className="oracle-content-band">
        <div className="oracle-form-grid oracle-form-grid--centered">
          <div className="oracle-form-card">
            <BirthForm onSubmit={(info) => setChart(generateChart(info))} />
          </div>
        </div>
        <div className="oracle-form-note">
          <p>登录后自动保存命盘 · 换设备也能看记录</p>
          <span>未登录时排盘不会保存，刷新即失</span>
        </div>
      </section>
    </OracleChrome>
  );
}

export function OracleStyles() {
  return (
    <style jsx global>{`
      .oracle-subpage {
        --oracle-page-accent: ${toneColor.gold};
        min-height: 100vh;
        background: #f8f6ef;
        color: #111;
        font-family: Inter, "Helvetica Neue", Arial, "PingFang SC", sans-serif;
      }
      .oracle-subpage--green { --oracle-page-accent: ${toneColor.green}; }
      .oracle-subpage--violet { --oracle-page-accent: ${toneColor.violet}; }
      .oracle-subpage--ink { --oracle-page-accent: ${toneColor.ink}; }
      .oracle-subpage a { color: inherit; }
      .oracle-subpage-header {
        position: sticky;
        top: 0;
        z-index: 80;
        height: 64px;
        padding: 0 32px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        background: rgba(248, 246, 239, 0.88);
        border-bottom: 1px solid rgba(0, 0, 0, 0.08);
        backdrop-filter: blur(18px);
      }
      .oracle-subpage-logo {
        font-size: 26px;
        line-height: 1;
        font-weight: 900;
        text-decoration: none;
        letter-spacing: -0.02em;
      }
      .oracle-subpage-actions {
        display: flex;
        align-items: center;
        gap: 6px;
        color: #c9c5b8;
        font-size: 13px;
      }
      .oracle-subpage-actions a,
      .oracle-subpage-actions button {
        border: 1px solid rgba(0, 0, 0, 0.12);
        border-radius: 999px;
        background: transparent;
        color: #111;
        padding: 5px 11px;
        text-decoration: none;
        font: inherit;
        cursor: pointer;
      }
      .oracle-subpage-actions button {
        background: #111;
        color: #fff;
        border-color: #111;
      }
      .oracle-subpage-hero {
        padding: 72px 24px 44px;
        max-width: 1040px;
        margin: 0 auto;
        text-align: center;
      }
      .oracle-subpage-hero > span,
      .oracle-section-title span,
      .oracle-panel > span,
      .oracle-module-status {
        color: var(--oracle-page-accent);
        font-size: 11px;
        letter-spacing: 0.28em;
        text-transform: uppercase;
      }
      .oracle-subpage-hero h1 {
        margin: 10px 0 8px;
        font-size: clamp(42px, 8vw, 96px);
        line-height: 0.95;
        letter-spacing: 0;
        font-weight: 900;
      }
      .oracle-subpage-subtitle {
        margin: 0;
        font-size: clamp(18px, 3vw, 32px);
        color: #34312a;
        font-weight: 600;
      }
      .oracle-subpage-description {
        max-width: 720px;
        margin: 18px auto 0;
        color: #686259;
        font-size: 15px;
        line-height: 1.85;
      }
      .oracle-subpage-stats {
        margin: 20px auto 0;
        display: inline-flex;
        border: 1px solid rgba(0, 0, 0, 0.1);
        border-radius: 999px;
        padding: 8px 16px;
        color: #4c473e;
        background: rgba(255,255,255,0.56);
        font-size: 13px;
      }
      .oracle-content-band {
        max-width: 1160px;
        margin: 0 auto;
        padding: 34px 24px;
      }
      .oracle-section-title {
        display: flex;
        align-items: end;
        justify-content: space-between;
        gap: 20px;
        margin-bottom: 20px;
      }
      .oracle-section-title h2 {
        margin: 4px 0 0;
        font-size: clamp(24px, 3vw, 42px);
        line-height: 1.1;
      }
      .oracle-section-title p {
        margin: 8px 0 0;
        color: #777168;
        font-size: 14px;
      }
      .oracle-module-rail {
        display: grid;
        grid-auto-flow: column;
        grid-auto-columns: minmax(260px, 330px);
        gap: 16px;
        overflow-x: auto;
        padding: 2px 2px 18px;
        scroll-snap-type: x mandatory;
      }
      .oracle-module-card {
        min-height: 300px;
        padding: 20px;
        border: 1px solid rgba(0,0,0,0.11);
        border-radius: 8px;
        background: rgba(255,255,255,0.72);
        text-align: left;
        scroll-snap-align: start;
        cursor: pointer;
        transition: transform 180ms ease, border-color 180ms ease, background 180ms ease;
      }
      .oracle-module-card:hover,
      .oracle-module-card.is-active {
        transform: translateY(-3px);
        background: #fff;
        border-color: color-mix(in srgb, var(--oracle-page-accent) 55%, rgba(0,0,0,0.12));
      }
      .oracle-module-card strong,
      .oracle-module-card b {
        display: block;
      }
      .oracle-module-card strong {
        margin-top: 30px;
        font-size: 14px;
        color: #827a70;
      }
      .oracle-module-card b {
        margin-top: 6px;
        font-size: 24px;
      }
      .oracle-module-card p {
        margin: 16px 0;
        color: #625d55;
        line-height: 1.7;
        font-size: 13px;
      }
      .oracle-module-card small {
        color: #8a847a;
      }
      .oracle-scroll-hint {
        text-align: center;
        color: #aaa395;
        font-size: 12px;
        margin: 4px 0 0;
      }
      .oracle-detail-grid,
      .oracle-form-grid {
        display: grid;
        grid-template-columns: minmax(0, 0.95fr) minmax(320px, 1.05fr);
        gap: 20px;
        align-items: start;
      }
      .oracle-form-grid--single {
        grid-template-columns: minmax(320px, 660px) minmax(260px, 1fr);
      }
      .oracle-panel,
      .oracle-form-card {
        border: 1px solid rgba(0,0,0,0.09);
        border-radius: 8px;
        background: rgba(255,255,255,0.76);
        padding: 22px;
      }
      .oracle-panel h3 {
        margin: 8px 0 12px;
        font-size: 22px;
      }
      .oracle-panel p {
        color: #625d55;
        line-height: 1.82;
        font-size: 14px;
      }
      .oracle-tag-row {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        margin-top: 18px;
      }
      .oracle-tag-row span {
        border: 1px solid rgba(0,0,0,0.1);
        border-radius: 999px;
        padding: 5px 10px;
        color: #665f55;
        font-size: 12px;
      }
      .oracle-chapter-list {
        display: grid;
        gap: 12px;
      }
      .oracle-chapter-list article,
      .oracle-roadmap article,
      .oracle-research-grid article {
        display: grid;
        grid-template-columns: 48px minmax(0, 1fr);
        gap: 16px;
        padding: 18px;
        border: 1px solid rgba(0,0,0,0.09);
        border-radius: 8px;
        background: rgba(255,255,255,0.72);
      }
      .oracle-chapter-list article > span,
      .oracle-roadmap span,
      .oracle-research-grid span {
        color: #bfb8aa;
        font-variant-numeric: tabular-nums;
      }
      .oracle-chapter-list h3,
      .oracle-roadmap h3,
      .oracle-research-grid h3 {
        margin: 0 0 8px;
        font-size: 18px;
      }
      .oracle-chapter-list p,
      .oracle-roadmap p,
      .oracle-research-grid p {
        margin: 0;
        color: #686259;
        font-size: 13px;
        line-height: 1.7;
      }
      .oracle-chapter-list ul {
        margin: 12px 0 0;
        padding-left: 18px;
        color: #5f5a52;
        font-size: 13px;
        line-height: 1.7;
      }
      .oracle-quote-panel {
        border-left: 2px solid var(--oracle-page-accent);
        padding: 6px 0 6px 22px;
        color: #4f493f;
      }
      .oracle-quote-panel p {
        max-width: 850px;
        line-height: 1.9;
      }
      .oracle-quote-panel blockquote {
        margin: 18px 0 0;
        font-size: clamp(20px, 3vw, 34px);
        line-height: 1.35;
        font-weight: 700;
      }
      .oracle-sanity-nav {
        margin-top: 28px;
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
      }
      .oracle-sanity-nav a,
      .oracle-back-home,
      .oracle-section-title a {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        border: 1px solid rgba(0,0,0,0.12);
        border-radius: 999px;
        padding: 9px 14px;
        text-decoration: none;
        color: #2a2824;
        background: rgba(255,255,255,0.5);
        font-size: 13px;
      }
      .oracle-sanity-nav a.is-active {
        background: #111;
        color: #fff;
      }
      .oracle-sanity-nav span {
        color: inherit;
        opacity: 0.58;
        letter-spacing: 0;
        font-size: 12px;
      }
      .oracle-back-home {
        width: fit-content;
        margin-top: 22px;
        cursor: pointer;
      }
      .oracle-research-grid,
      .oracle-roadmap {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 14px;
      }
      .oracle-roadmap {
        grid-template-columns: repeat(4, minmax(0, 1fr));
      }
      .oracle-check-list {
        margin: 0 0 16px;
        padding-left: 18px;
        color: #4f493f;
        line-height: 1.9;
      }
      .oracle-kpi-row {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 10px;
        margin-top: 20px;
      }
      .oracle-kpi-row strong {
        border-top: 1px solid rgba(0,0,0,0.1);
        padding-top: 12px;
        font-size: 28px;
      }
      .oracle-kpi-row small {
        display: block;
        color: #81786c;
        font-size: 11px;
        font-weight: 400;
      }
      .oracle-academy-stars {
        display: grid;
        grid-template-columns: repeat(7, minmax(0, 1fr));
        gap: 10px;
      }
      .oracle-academy-stars a,
      .oracle-academy-feature-grid a,
      .oracle-book-row a {
        border: 1px solid rgba(0,0,0,0.1);
        border-radius: 8px;
        background: rgba(255,255,255,0.72);
        padding: 16px;
        text-decoration: none;
        transition: transform 180ms ease, border-color 180ms ease, background 180ms ease;
      }
      .oracle-academy-stars a:hover,
      .oracle-academy-feature-grid a:hover,
      .oracle-book-row a:hover {
        transform: translateY(-2px);
        background: #fff;
        border-color: rgba(0,0,0,0.25);
      }
      .oracle-academy-stars strong,
      .oracle-academy-stars span,
      .oracle-academy-feature-grid b,
      .oracle-academy-feature-grid span,
      .oracle-academy-feature-grid small,
      .oracle-book-row span,
      .oracle-book-row b,
      .oracle-book-row p,
      .oracle-book-row small {
        display: block;
      }
      .oracle-academy-stars strong {
        font-size: 22px;
        margin-bottom: 8px;
      }
      .oracle-academy-stars span,
      .oracle-academy-feature-grid span,
      .oracle-book-row p {
        color: #686259;
        font-size: 13px;
        line-height: 1.7;
      }
      .oracle-academy-feature-grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 14px;
        margin-top: 16px;
      }
      .oracle-academy-feature-grid b {
        font-size: 20px;
        margin-bottom: 8px;
      }
      .oracle-academy-feature-grid small,
      .oracle-book-row small,
      .oracle-book-row span,
      .oracle-library-groups > div > span {
        color: #9a9285;
        font-size: 12px;
      }
      .oracle-library-groups {
        display: grid;
        gap: 18px;
      }
      .oracle-library-groups h3 {
        margin: 4px 0;
        font-size: 24px;
      }
      .oracle-library-groups > div > p {
        margin: 0;
        color: #686259;
      }
      .oracle-book-row {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 14px;
      }
      .oracle-book-row b {
        margin: 8px 0;
        font-size: 20px;
      }
      .oracle-chart-workspace {
        max-width: 1280px;
        margin: 0 auto;
        padding: 28px 20px 60px;
        display: grid;
        grid-template-columns: minmax(0, 1fr) minmax(320px, 380px);
        gap: 20px;
      }
      .oracle-subpage-footer {
        max-width: 1160px;
        margin: 30px auto 0;
        padding: 28px 24px 44px;
        color: #8c8579;
        font-size: 12px;
        line-height: 1.7;
        border-top: 1px solid rgba(0,0,0,0.08);
      }
      .oracle-subpage-footer-row {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 0 8px;
      }
      .oracle-subpage-footer a {
        color: inherit;
        text-decoration: none;
      }
      .oracle-subpage-footer em {
        font-style: normal;
      }
      .oracle-subpage-footer span {
        color: rgba(140,133,121,0.45);
      }
      .oracle-subpage-footer p {
        max-width: 820px;
        margin: 8px 0;
        line-height: 1.8;
      }
      @media (max-width: 860px) {
        .oracle-subpage-header { padding: 0 16px; height: 56px; }
        .oracle-subpage-logo { font-size: 22px; }
        .oracle-subpage-actions { font-size: 12px; }
        .oracle-subpage-hero { padding-top: 46px; }
        .oracle-detail-grid,
        .oracle-form-grid,
        .oracle-form-grid--single,
        .oracle-chart-workspace {
          grid-template-columns: 1fr;
        }
        .oracle-research-grid,
        .oracle-roadmap {
          grid-template-columns: 1fr;
        }
        .oracle-academy-stars {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }
        .oracle-academy-feature-grid,
        .oracle-book-row {
          grid-template-columns: 1fr;
        }
        .oracle-section-title {
          display: block;
        }
      }
      @media (max-width: 520px) {
        .oracle-subpage-actions span,
        .oracle-subpage-actions button { display: none; }
        .oracle-content-band { padding: 28px 14px; }
        .oracle-panel,
        .oracle-form-card { padding: 14px; }
        .oracle-module-rail { grid-auto-columns: minmax(238px, 82vw); }
      }
    `}</style>
  );
}
