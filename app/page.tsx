'use client';

import Image from 'next/image';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useMemo, useRef, useState } from 'react';

type ViewMode = 'vertical' | 'horizontal' | 'grid';

const WORKS = [
  {
    title: '紫微命盘',
    en: 'Destiny Engine',
    desc: '输入生辰，查看您的紫微命盘与传统知识解读',
    note: '易经 · 倪师体系',
    aside: 'AI Interpretation',
    href: '/chart',
    image: '/images/scenes/hero-bg.jpg',
  },
  {
    title: '合盘分析',
    en: 'Synastry',
    desc: '对比两人命盘，研究宫位与星曜在关系中的应用',
    note: '关系智能',
    aside: 'Dual Chart Analysis',
    href: '/heming',
    image: '/images/scenes/synastry.webp',
  },
  {
    title: '命理学双子',
    en: 'Chart Twins',
    desc: '匹配同命盘配置，研究相同星曜与宫位组合的数据样本（真人地理分布即将上线）',
    note: '数据匹配',
    aside: 'Life Scripts',
    href: '/twins',
    image: '/images/scenes/destiny-twins.webp',
  },
  {
    title: '天纪 · 命理',
    en: 'Tian Ji',
    desc: '上知天文 — 紫微斗数命理体系',
    note: '学术体系',
    aside: 'Zi Wei Dou Shu',
    href: '/tianji',
    image: '/images/scenes/sanji-tianji.jpg',
  },
  {
    title: '地纪 · 堪舆',
    en: 'Di Ji',
    desc: '下知地理 — 风水堪舆经典',
    note: '学术体系',
    aside: 'Feng Shui',
    href: '/diji',
    image: '/images/scenes/sanji-diji.jpg',
  },
  {
    title: '人纪 · 中医',
    en: 'Ren Ji',
    desc: '中知人事 — 黄帝内经养生纲领',
    note: '学术体系',
    aside: 'TCM Classics',
    href: '/renji',
    image: '/images/scenes/sanji-renji.jpg',
  },
  {
    title: '学术中心',
    en: 'Academy',
    desc: '14 主星 × 13 宫位 + 6 部古籍原典',
    note: '知识引擎',
    aside: 'Knowledge + Classics',
    href: '/academy',
    image: '/images/scenes/hero-clean.jpg',
  },
];

function frameStyle(mode: ViewMode) {
  if (mode === 'grid') return { width: 760, height: 510 };
  if (mode === 'horizontal') return { width: 300, height: 382 };
  return { width: 292, height: 372 };
}

function OracleFrame({ width, height, pulseKey }: { width: number; height: number; pulseKey: number }) {
  const [pulse, setPulse] = useState(false);

  useEffect(() => {
    setPulse(true);
    const timeout = window.setTimeout(() => setPulse(false), 320);
    return () => window.clearTimeout(timeout);
  }, [pulseKey]);

  return (
    <div
      className="oracle-frame"
      style={{
        width,
        height,
        transform: `translate(-50%, -50%) scale(${pulse ? 1.035 : 1})`,
      }}
      aria-hidden="true"
    >
      <span />
      <span />
      <span />
      <span />
    </div>
  );
}

export default function HomePage() {
  const [active, setActive] = useState(0);
  const [hovered, setHovered] = useState<number | null>(null);
  const [mode, setMode] = useState<ViewMode>('vertical');
  const cardsRef = useRef<Array<HTMLAnchorElement | null>>([]);
  const scrollerRef = useRef<HTMLDivElement | null>(null);

  const displayIndex = hovered ?? active;
  const activeWork = WORKS[displayIndex] ?? WORKS[0];
  const activeNumber = useMemo(() => String(displayIndex + 1).padStart(2, '0'), [displayIndex]);
  const frame = frameStyle(mode);

  useEffect(() => {
    document.documentElement.style.background = '#fafafa';
    document.body.style.background = '#fafafa';
    document.documentElement.setAttribute('data-theme', 'light');
    return () => {
      document.documentElement.style.background = '';
      document.body.style.background = '';
    };
  }, []);

  useEffect(() => {
    const cards = cardsRef.current.filter(Boolean) as HTMLAnchorElement[];
    if (mode !== 'vertical' || cards.length === 0) return;

    let raf = 0;

    const updateActive = () => {
      const center = window.innerHeight / 2;

      let next = 0;
      let nearest = Number.POSITIVE_INFINITY;

      cards.forEach((card, index) => {
        const rect = card.getBoundingClientRect();
        const cardCenter = rect.top + rect.height / 2;
        const distance = Math.abs(cardCenter - center);
        if (distance < nearest) {
          nearest = distance;
          next = index;
        }
      });

      setActive(next);
    };

    const scheduleUpdateActive = () => {
      if (raf) return;
      raf = window.requestAnimationFrame(() => {
        raf = 0;
        updateActive();
      });
    };

    updateActive();
    window.addEventListener('scroll', scheduleUpdateActive, { passive: true });
    window.addEventListener('resize', updateActive);

    return () => {
      window.removeEventListener('scroll', scheduleUpdateActive);
      window.removeEventListener('resize', updateActive);
      if (raf) window.cancelAnimationFrame(raf);
    };
  }, [mode]);

  useEffect(() => {
    if (mode !== 'vertical') return;
    if (window.matchMedia('(max-width: 767px)').matches) return;
    const root = document.documentElement;
    const previous = root.style.scrollSnapType;
    root.style.scrollSnapType = 'y mandatory';
    return () => {
      root.style.scrollSnapType = previous;
    };
  }, [mode]);

  const goTo = (index: number) => {
    const card = cardsRef.current[index];
    if (!card) return;

    card.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const switchMode = (nextMode: ViewMode) => {
    setMode(nextMode);
  };

  return (
    <main className={`oracle-home oracle-home--${mode}`} ref={scrollerRef}>
      <header className="oracle-header">
        <button className="oracle-logo" aria-label="回到顶部" onClick={() => goTo(0)}>
          ORACLE
        </button>

        <div className="oracle-actions">
          <div className="oracle-top-links">
            <Link className="oracle-pill-link" href="/chart">起盘</Link>
            <span>·</span>
            <Link className="oracle-pill-link" href="/heming">合盘</Link>
            <button className="oracle-pro" type="button">专业版</button>
          </div>
        </div>
      </header>

      <motion.nav
        className="oracle-side-nav"
        aria-label="首页模块"
        animate={mode === 'vertical' ? { y: -(25.4 * active + 11.7) } : { y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      >
        {WORKS.map((work, index) => (
          <button
            key={work.title}
            type="button"
            className={index === active ? 'is-active' : ''}
            onClick={() => goTo(index)}
            onMouseEnter={() => setHovered(index)}
            onMouseLeave={() => setHovered(null)}
            onPointerEnter={() => setHovered(index)}
            onPointerLeave={() => setHovered(null)}
            onFocus={() => setHovered(index)}
            onBlur={() => setHovered(null)}
          >
            {work.title}
          </button>
        ))}
      </motion.nav>

      <div className="oracle-left-caption" aria-live="polite">
        <AnimatePresence mode="wait">
          <motion.span
            key={activeWork.note}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3 }}
          >
            {activeWork.note}
          </motion.span>
        </AnimatePresence>
      </div>

      <div className="oracle-right-caption" aria-live="polite">
        <AnimatePresence mode="wait">
          <motion.span
            key={activeWork.aside}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3 }}
          >
            {activeWork.aside}
          </motion.span>
        </AnimatePresence>
        <b>{activeNumber}</b>
      </div>

      <OracleFrame width={frame.width} height={frame.height} pulseKey={active} />

      <section className="oracle-stage" aria-label="Oracle 模块入口">
        {WORKS.map((work, index) => (
          <Link
            key={work.title}
            ref={(node) => {
              cardsRef.current[index] = node;
            }}
            className={`oracle-card ${index === active ? 'is-active' : ''}`}
            href={work.href}
          >
            <motion.div
              className="oracle-card-inner"
              animate={mode === 'vertical' ? { scale: index === active ? 1 : 0.92, opacity: index === active ? 1 : 0.4 } : {}}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            >
              <Image
                src={work.image}
                alt={work.title}
                fill
                sizes={mode === 'grid' ? '(max-width: 900px) 44vw, 220px' : '260px'}
                priority={index < 2}
              />
              <div className="oracle-card-overlay">
                <strong>{work.title}</strong>
                <span>{work.en}</span>
                <p>{work.desc}</p>
              </div>
            </motion.div>
          </Link>
        ))}
      </section>

      <footer className="oracle-footer">
        <div className="oracle-mode-switch" aria-label="视图模式">
          {(['vertical', 'horizontal', 'grid'] as const).map((item, index) => (
            <span key={item}>
              {index > 0 && <i>,</i>}
              <button
                type="button"
                aria-pressed={mode === item}
                className={mode === item ? 'is-active' : ''}
                onClick={() => switchMode(item)}
              >
                {item}
              </button>
            </span>
          ))}
        </div>

        <div className="oracle-legal">
          <Link href="/terms">免责声明</Link>
          <span>·</span>
          <Link href="/privacy">隐私</Link>
          <span>·</span>
          <a href="mailto:feedback@wdyziweidoushu666.com?subject=违法和不良信息举报">举报</a>
          <span>·</span>
          <a href="https://beian.miit.gov.cn/" target="_blank" rel="noopener noreferrer">京ICP备2026027116号</a>
          <span>·</span>
          <em>©2026 Oracle</em>
        </div>
      </footer>

      <style jsx global>{`
        :root {
          --oracle-bg: #fafafa;
          --oracle-black: #000;
          --oracle-muted: #6b6b6b;
          --oracle-faint: #bbb;
          --oracle-line: #d4d4d4;
          --oracle-ease: cubic-bezier(0.16, 1, 0.3, 1);
        }

        html,
        body {
          background: var(--oracle-bg);
        }

        .oracle-home {
          min-height: 100vh;
          background: var(--oracle-bg);
          color: var(--oracle-black);
          position: relative;
          overflow-x: clip;
          font-family: Inter, "Helvetica Neue", Arial, "PingFang SC", sans-serif;
        }

        .oracle-home button,
        .oracle-home a {
          -webkit-tap-highlight-color: transparent;
        }

        .oracle-header {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          z-index: 100;
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          padding: 24px 32px;
          pointer-events: none;
        }

        .oracle-logo {
          pointer-events: auto;
          cursor: pointer;
          border: 0;
          background: none;
          padding: 0;
          color: var(--oracle-black);
          font: inherit;
          font-size: 42px;
          font-weight: 900;
          letter-spacing: -0.02em;
          line-height: 1;
          text-align: left;
        }

        .oracle-actions {
          pointer-events: auto;
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 14px;
        }

        .oracle-top-links {
          display: flex;
          align-items: center;
          gap: 6px;
          color: var(--oracle-line);
          font-size: 14px;
        }

        .oracle-pill-link {
          color: #111;
          border: 1px solid rgba(0, 0, 0, 0.12);
          border-radius: 999px;
          padding: 4px 10px;
          font-size: 13px;
          line-height: 1.2;
          text-decoration: none;
          transition: background 180ms var(--oracle-ease), border-color 180ms var(--oracle-ease);
        }

        .oracle-pill-link:hover {
          background: #fff;
          border-color: rgba(0, 0, 0, 0.26);
        }

        .oracle-pro {
          margin-left: 8px;
          border: 0;
          border-radius: 999px;
          background: #000;
          color: #fff;
          cursor: pointer;
          font: inherit;
          font-size: 13px;
          font-weight: 500;
          line-height: 1.2;
          padding: 5px 14px;
          transition: transform 180ms var(--oracle-ease), opacity 180ms var(--oracle-ease);
        }

        .oracle-pro:hover {
          opacity: 0.82;
        }

        .oracle-pro:active {
          transform: scale(0.96);
        }

        .oracle-side-nav {
          position: fixed;
          left: 32px;
          top: 50%;
          z-index: 90;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .oracle-side-nav button {
          cursor: pointer;
          border: 0;
          background: none;
          padding: 0;
          color: var(--oracle-faint);
          font: inherit;
          font-size: 14px;
          font-weight: 400;
          line-height: 1.8;
          text-align: left;
          white-space: nowrap;
          transition: color 220ms var(--oracle-ease), font-weight 220ms var(--oracle-ease);
        }

        .oracle-side-nav button.is-active,
        .oracle-side-nav button:hover {
          color: var(--oracle-black);
          font-weight: 700;
        }

        .oracle-left-caption,
        .oracle-right-caption {
          position: fixed;
          top: 50%;
          z-index: 90;
          pointer-events: none;
          color: var(--oracle-muted);
          font-size: 14px;
        }

        .oracle-left-caption {
          left: 200px;
          transform: translateY(-50%);
        }

        .oracle-right-caption {
          right: 32px;
          display: flex;
          align-items: center;
          gap: 24px;
          transform: translateY(-50%);
          text-align: right;
        }

        .oracle-right-caption b {
          color: #ccc;
          font-size: 14px;
          font-variant-numeric: tabular-nums;
          font-weight: 400;
        }

        .oracle-frame {
          position: fixed;
          top: 50%;
          left: 50%;
          z-index: 80;
          pointer-events: none;
          transition:
            width 450ms var(--oracle-ease),
            height 450ms var(--oracle-ease),
            transform 450ms var(--oracle-ease);
        }

        .oracle-frame span {
          position: absolute;
          width: 20px;
          height: 20px;
        }

        .oracle-frame span:nth-child(1) {
          top: 0;
          left: 0;
          border-top: 1.5px solid #000;
          border-left: 1.5px solid #000;
        }

        .oracle-frame span:nth-child(2) {
          top: 0;
          right: 0;
          border-top: 1.5px solid #000;
          border-right: 1.5px solid #000;
        }

        .oracle-frame span:nth-child(3) {
          right: 0;
          bottom: 0;
          border-right: 1.5px solid #000;
          border-bottom: 1.5px solid #000;
        }

        .oracle-frame span:nth-child(4) {
          bottom: 0;
          left: 0;
          border-bottom: 1.5px solid #000;
          border-left: 1.5px solid #000;
        }

        .oracle-stage {
          position: relative;
          z-index: 10;
          display: flex;
          align-items: center;
        }

        .oracle-home--vertical .oracle-stage {
          flex-direction: column;
          padding-top: calc(50vh - 170px);
          padding-bottom: 40vh;
        }

        .oracle-home--horizontal {
          min-height: 100vh;
          overflow-x: auto;
          overflow-y: hidden;
          scroll-snap-type: x mandatory;
        }

        .oracle-home--horizontal .oracle-stage {
          width: max-content;
          min-height: 100vh;
          flex-direction: row;
          gap: 80px;
          padding: 0 calc(50vw - 130px);
        }

        .oracle-home--grid {
          overflow-y: auto;
        }

        .oracle-home--grid .oracle-stage {
          width: min(760px, calc(100vw - 48px));
          min-height: 100vh;
          margin: 0 auto;
          padding: 150px 0 140px;
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 22px;
          align-content: center;
        }

        .oracle-card {
          display: block;
          position: relative;
          width: 260px;
          height: 340px;
          flex: 0 0 auto;
          overflow: hidden;
          border-radius: 8px;
          color: #fff;
          text-decoration: none;
          scroll-snap-align: center;
        }

        .oracle-home--vertical .oracle-card {
          margin-bottom: 80px;
        }

        .oracle-home--grid .oracle-card {
          width: 100%;
          height: auto;
          aspect-ratio: 13 / 17;
          margin: 0;
        }

        .oracle-card-inner {
          position: relative;
          width: 100%;
          height: 100%;
        }

        .oracle-card img {
          object-fit: cover;
        }

        .oracle-card-overlay {
          position: absolute;
          inset: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 28px;
          background: rgba(0, 0, 0, 0.6);
          opacity: 0;
          text-align: center;
          transition: opacity 260ms var(--oracle-ease);
        }

        .oracle-card:hover .oracle-card-overlay,
        .oracle-home--grid .oracle-card.is-active .oracle-card-overlay {
          opacity: 1;
        }

        .oracle-card-overlay strong {
          color: #fff;
          font-size: 20px;
          font-weight: 700;
          letter-spacing: 0.1em;
          line-height: 1.35;
        }

        .oracle-card-overlay span {
          color: rgba(255, 255, 255, 0.62);
          font-size: 14px;
          letter-spacing: 0.2em;
        }

        .oracle-card-overlay p {
          max-width: 200px;
          margin: 8px 0 0;
          color: rgba(255, 255, 255, 0.58);
          font-size: 14px;
          line-height: 1.7;
        }

        .oracle-footer {
          position: fixed;
          right: 0;
          bottom: 0;
          left: 0;
          z-index: 100;
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 24px;
          padding: 24px 32px;
          pointer-events: none;
        }

        .oracle-mode-switch,
        .oracle-legal {
          pointer-events: auto;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .oracle-mode-switch {
          color: #aaa;
          font-size: 14px;
        }

        .oracle-mode-switch span {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .oracle-mode-switch i {
          color: #ccc;
          font-style: normal;
        }

        .oracle-mode-switch button {
          cursor: pointer;
          border: 0;
          background: none;
          padding: 0;
          color: #aaa;
          font: inherit;
          letter-spacing: 0.02em;
          text-decoration: none;
          text-underline-offset: 4px;
          text-transform: capitalize;
          transition: color 220ms var(--oracle-ease);
        }

        .oracle-mode-switch button.is-active {
          color: #000;
          text-decoration: underline;
        }

        .oracle-legal {
          max-width: none;
          flex-wrap: wrap;
          justify-content: flex-end;
          color: #6b6b6b;
          font-size: 12px;
        }

        .oracle-legal a,
        .oracle-legal em {
          color: #6b6b6b;
          font-style: normal;
          text-decoration: none;
        }

        .oracle-legal span {
          color: #ddd;
        }

        @keyframes oracleCaption {
          from {
            opacity: 0;
            transform: translateY(8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @media (max-width: 900px) {
          .oracle-header {
            padding: 18px 20px;
          }

          .oracle-logo {
            font-size: 32px;
          }

          .oracle-side-nav,
          .oracle-left-caption {
            display: none;
          }

          .oracle-right-caption {
            top: auto;
            right: 20px;
            bottom: 82px;
            transform: none;
          }

          .oracle-frame {
            width: 292px !important;
            height: 372px !important;
          }

          .oracle-home--grid .oracle-frame {
            display: none;
          }

          .oracle-home--grid .oracle-stage {
            width: calc(100vw - 32px);
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 14px;
            padding-top: 118px;
          }

          .oracle-footer {
            align-items: flex-start;
            flex-direction: column;
            padding: 18px 20px;
          }

          .oracle-legal {
            justify-content: flex-start;
            max-width: 320px;
          }
        }

        @media (max-width: 560px) {
          .oracle-header {
            align-items: flex-start;
          }

          .oracle-logo {
            font-size: 28px;
          }

          .oracle-top-links {
            gap: 4px;
          }

          .oracle-pill-link {
            padding: 4px 8px;
          }

          .oracle-pro {
            margin-left: 4px;
            padding: 5px 10px;
          }

          .oracle-card {
            width: 236px;
            height: 308px;
          }

          .oracle-home--vertical .oracle-stage {
            padding-top: calc(50vh - 154px);
          }

          .oracle-home--horizontal .oracle-stage {
            gap: 48px;
            padding: 0 calc(50vw - 118px);
          }

          .oracle-frame {
            width: 266px !important;
            height: 338px !important;
          }

          .oracle-right-caption span {
            display: none;
          }

          .oracle-home--grid .oracle-stage {
            grid-template-columns: repeat(2, minmax(0, 1fr));
            padding-bottom: 190px;
          }
        }
      `}</style>
    </main>
  );
}
