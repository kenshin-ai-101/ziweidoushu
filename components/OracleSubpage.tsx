'use client';

import Image from 'next/image';
import Link from 'next/link';
import { cloneElement, isValidElement, useEffect } from 'react';
import { OracleFooter } from '@/components/OracleFooter';
import BirthForm from '@/components/BirthForm';
import type { NiModule, SanJiCategory } from '@/lib/nihai';
import { SANJI_CATEGORIES } from '@/lib/nihai';

type ShellTone = 'gold' | 'green' | 'violet' | 'ink';

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
    tianxiang: { subtitle: '天文现象与古代历法体系研究\n28宿七政 · 观天识变' },
    cezi: { subtitle: '字理文化与汉字形义的学问研读\n拆字法 · 会意法' },
    liuren: { subtitle: '六壬学传统应用的知识体系\n掐指速算 · 心血来潮即断' },
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

function moduleSceneSrc(category: SanJiCategory, slug: string) {
  return `/images/scenes/${category}/${slug}.webp`;
}

function getModuleCardCopy(category: SanJiCategory, module: NiModule) {
  const copy = productionCardCopy[category]?.[module.slug];
  const raw = copy?.subtitle ?? module.subtitle;
  const [line1, line2FromCopy] = raw.split('\n');
  const line2 = line2FromCopy ?? (
    copy?.subtitle && !copy.subtitle.includes('\n') && module.subtitle !== line1
      ? module.subtitle
      : undefined
  );
  const chapter = productionChapterLabels[category]?.[module.slug]
    ?? `${module.chapters.length} 章节${module.school ? ` · ${module.school}` : ' · 进入学科 →'}`;

  return { pre: copy?.pre, line1, line2, chapter };
}

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
    <>
      <a href="#main-content" className="oracle-skip-link">跳转到主要内容</a>
      <main className={`oracle-subpage oracle-subpage--${tone} ${compact ? 'oracle-subpage--compact' : ''} ${variant ? `oracle-subpage--${variant}` : ''}`}>
        <header className="oracle-subpage-header">
          <Link className="oracle-subpage-logo" href="/" aria-label="回到首页">
            {variant === 'terms' ? 'ORACLE®' : 'METIS'}
          </Link>
          <div className="oracle-subpage-actions-wrap">
            <nav className="oracle-subpage-actions" aria-label="主导航">
              <Link className="oracle-subpage-pill" href="/chart">起盘</Link>
              <span aria-hidden="true">·</span>
              <Link className="oracle-subpage-pill" href="/heming">合盘</Link>
              <button type="button" className="oracle-subpage-actions-edition">普通版</button>
            </nav>
            <button type="button" className="oracle-subpage-burger" aria-label="菜单">☰</button>
          </div>
        </header>
        <div id="main-content" className="oracle-subpage-body">
          {children}
        </div>
        <OracleFooter showBackLink={variant !== 'chart'} />
      </main>
    </>
  );
}

export function OracleHero({
  eyebrow,
  title,
  subtitle,
  description,
  stats,
  align = 'left',
  showDivider = false,
  hideSubtitle = false,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  description: string;
  stats?: string;
  align?: 'left' | 'center';
  showDivider?: boolean;
  hideSubtitle?: boolean;
}) {
  return (
    <section className={`oracle-subpage-hero oracle-subpage-hero--${align}`}>
      {eyebrow && <span className="oracle-subpage-eyebrow">{eyebrow}</span>}
      <h1>{title}</h1>
      {!hideSubtitle && subtitle && (
        <p className="oracle-subpage-subtitle">{subtitle}</p>
      )}
      <p className="oracle-subpage-description">{description}</p>
      {stats && <div className="oracle-subpage-stats">{stats}</div>}
      {showDivider && <div className="oracle-subpage-hero-divider" aria-hidden="true" />}
    </section>
  );
}

export { OracleFooter } from '@/components/OracleFooter';

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
      <div className="oracle-section-title-row">
        <span className="oracle-section-index">{index}</span>
        <h2>{title}</h2>
        {subtitle && <span className="oracle-section-subtitle">{subtitle}</span>}
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
  quoteSource,
  statLine,
  sectionTitle,
  sectionSubtitle,
  quoteIndex = '02',
  beforeQuote,
  disclaimer,
  children,
}: {
  category: SanJiCategory;
  modules: NiModule[];
  quote: React.ReactNode;
  quoteFrom: string;
  quoteSource?: string;
  statLine: string;
  sectionTitle: string;
  sectionSubtitle: string;
  quoteIndex?: string;
  beforeQuote?: React.ReactNode;
  disclaimer?: string;
  children?: React.ReactNode;
}) {
  const config = SANJI_CATEGORIES.find(item => item.key === category) ?? SANJI_CATEGORIES[0];
  const tone = category === 'diji' ? 'green' : category === 'renji' ? 'violet' : 'gold';

  return (
    <OracleChrome tone={tone}>
      <OracleHero
        key="sanji-hero"
        eyebrow={`NI HAI XIA · ${config.nameEn.toUpperCase()}`}
        title={config.name}
        subtitle={config.meaning}
        description={statLine}
        showDivider
      />

      <section key="sanji-modules" className="oracle-content-band">
        <SectionTitle index="01" title={sectionTitle} subtitle={sectionSubtitle} />
        <div className="oracle-module-rail" aria-label={sectionTitle}>
          {modules.map(module => {
            const { pre, line1, line2, chapter } = getModuleCardCopy(category, module);

            return (
              <Link
                key={module.id}
                className="oracle-module-card"
                href={`/sanji/${module.slug}`}
              >
                <Image
                  src={moduleSceneSrc(category, module.slug)}
                  alt={module.name}
                  fill
                  sizes="300px"
                  className="oracle-module-card-img"
                />
                <div className="oracle-module-card-shade" aria-hidden="true" />
                {pre && <span className="oracle-module-card-pre">{pre}</span>}
                <span className="oracle-module-status oracle-module-status--live">LIVE</span>
                <div className="oracle-module-card-body">
                  <div className="oracle-module-card-en">{module.nameEn}</div>
                  <h3>{module.name}</h3>
                  <p className="oracle-module-card-desc">{line1}</p>
                  {line2 && <p className="oracle-module-card-meta">{line2}</p>}
                  <div className="oracle-module-card-chapter">{chapter}</div>
                </div>
              </Link>
            );
          })}
        </div>
        {category === 'tianji' && (
          <p className="oracle-scroll-hint">← 横向滑动浏览全部学科 →</p>
        )}
      </section>

      {beforeQuote
        ? isValidElement(beforeQuote)
          ? cloneElement(beforeQuote, { key: 'sanji-before-quote' })
          : beforeQuote
        : null}

      <section key="sanji-quote" className="oracle-content-band">
        <SectionTitle index={quoteIndex} title="倪师一言" />
        <div className="oracle-quote-panel">
          <div className="oracle-quote-panel-body">{quote}</div>
          <blockquote>
            <span>「{quoteFrom}」</span>
            {quoteSource && <cite>— {quoteSource}</cite>}
          </blockquote>
        </div>
        {disclaimer && <p className="oracle-renji-disclaimer">{disclaimer}</p>}
        {!children && (
          <div className="oracle-sanity-nav">
            {SANJI_CATEGORIES.map(item => (
              <Link key={item.key} href={item.href} className={item.key === category ? 'is-active' : ''}>
                {item.name}<span>{item.meaning}</span>
              </Link>
            ))}
          </div>
        )}
      </section>

      {children && (
        <section key="sanji-extra" className="oracle-content-band">
          {children}
          <div className="oracle-sanity-nav">
            {SANJI_CATEGORIES.map(item => (
              <Link key={item.key} href={item.href} className={item.key === category ? 'is-active' : ''}>
                {item.name}<span>{item.meaning}</span>
              </Link>
            ))}
          </div>
        </section>
      )}
    </OracleChrome>
  );
}

export function TwinsPage() {
  return (
    <OracleChrome tone="ink">
      <OracleHero
        title="命运双胞胎"
        description="分析命盘配置 —— 查询与您星曜宫位相同的命理学样本群体。数据分析工具，供学术研究与文化参考；真人地理分布即将上线，仅显示地域、不暴露身份。"
        showDivider
      />

      <section className="oracle-content-band">
        <SectionTitle
          index="INPUT"
          title="输入你的出生信息"
          subtitle="填出生地以校正真太阳时 — 时辰差一格，整张盘和双胞胎都会变。"
        />
        <div className="oracle-form-grid oracle-form-grid--centered">
          <div className="oracle-form-card">
            <BirthForm
              appearance="light"
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
            ['02', '真太阳时辰', '120 分钟分辨率，已含经纬度→真太阳时校正'],
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
          <ul className="oracle-exclude-list">
            <li>出生地（经纬度只是算真太阳时的中间变量，不参与配对）</li>
            <li>城市、行政区</li>
            <li>出生时的具体分钟数（120 分钟时辰窗口内任何分钟都算同一时辰）</li>
          </ul>
          <p>
            为什么经纬度不参与？因为经纬度的作用是<strong>算真太阳时</strong>的中间变量。
            张三在北京 8:00 出生（真太阳时 ~7:46）和李四在乌鲁木齐 9:10 出生（真太阳时 ~7:00）都落在「辰时」窗口，
            两人本命盘 + 大限 + 流年流月流日流时全部相同 → 这才是命运双胞胎。
            地理差异不是排除条件，反而是<strong>核心解读维度</strong>。
          </p>
        </div>
      </section>

      <section className="oracle-content-band">
        <SectionTitle index="03" title="功能路线图" subtitle="4 个层次的能力，01-03 已就绪，04 筹备中" />
        <div className="oracle-roadmap">
          {[
            ['01', '严格匹配 + 人数估算 已就绪', '同年月日 × 同真太阳时辰 × 同性别 → 确定性命中（同 key 即同盘，无需 AI）；并按出生年人口给出「全国约 N 人与你同盘」的估算。'],
            ['02', '出生地时间窗 已就绪', '同命格但你在北京、他在乌鲁木齐 → 逐城反推「你的双胞胎在当地什么钟表时间出生」（真太阳时换算，专业版全国 30+ 城）。'],
            ['03', '结构双子星 Top20 已就绪', '在 67.5 万张命盘中检索与你结构最相近的盘：同年同构（大限流年同步展开）与跨年同构分层呈现。专业版专属。'],
            ['04', '人生时间线对照 筹备中', '把双子星盘的大限运程逐段并排，对照你即将面对的同段大限，做预演式参考。'],
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
        <p className="oracle-note-text">
          「877w」指 67.5 万独立命盘 × 13 个解读维度的解读文案总量，并非真人数量。命运双胞胎的真人地理分布功能正在筹备中（上线后仅显示地域分布，不暴露姓名、生辰等任何个人身份信息）。
        </p>
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

export { ChartOraclePage } from '@/components/ChartOraclePage';
