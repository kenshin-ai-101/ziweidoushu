'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { MembershipEditionButton } from '@/components/MembershipEditionButton';
import { useAuth } from '@/hooks/use-auth';
import type { NiModule } from '@/lib/nihai';
import {
  getCategoryConfig,
  getModuleChapterCount,
  getModuleDisclaimer,
  getModuleDisplayIcon,
  getModuleCardSubtitle,
  getModuleNextSteps,
  getModuleSceneSrc,
  getSiblingModules,
} from '@/lib/nihai/modules';

function MetisHeader() {
  return (
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
          cursor: 'pointer',
          textDecoration: 'none',
          position: 'relative',
          zIndex: 1,
        }}
      >
        <div
          style={{
            fontSize: 'clamp(26px, 3vw, 42px)',
            fontWeight: 900,
            letterSpacing: '-0.02em',
            lineHeight: 1,
            color: '#000',
            fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
          }}
        >
          METIS
        </div>
      </Link>

      <div
        style={{
          pointerEvents: 'auto',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-end',
          gap: 10,
          position: 'relative',
          zIndex: 1,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 'clamp(2px, 0.4vw, 6px)' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 'clamp(2px, 0.4vw, 6px)' }}>
            <Link
              className="obys-pill-link"
              style={{ fontSize: 'clamp(11px, 1.1vw, 13px)', padding: 'clamp(3px, 0.4vw, 4px) clamp(6px, 1vw, 10px)' }}
              href="/chart"
            >
              起盘
            </Link>
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 'clamp(2px, 0.4vw, 6px)' }}>
            <span style={{ color: '#d4d4d4', fontSize: 'var(--fs-10)' }}>·</span>
            <Link
              className="obys-pill-link"
              style={{ fontSize: 'clamp(11px, 1.1vw, 13px)', padding: 'clamp(3px, 0.4vw, 4px) clamp(6px, 1vw, 10px)' }}
              href="/heming"
            >
              合盘
            </Link>
          </span>
          <MembershipEditionButton variant="obys" />
        </div>
      </div>
    </header>
  );
}

export function SanjiModulePage({ module }: { module: NiModule }) {
  const { isPro } = useAuth();
  const category = getCategoryConfig(module.category);
  const siblings = getSiblingModules(module);
  const nextSteps = getModuleNextSteps(module);
  const chapterCount = getModuleChapterCount(module);
  const sceneSrc = getModuleSceneSrc(module.category, module.slug);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', 'light');
    document.documentElement.style.background = '#fafafa';
    document.body.style.background = '#fafafa';
    window.dispatchEvent(new CustomEvent('ziwei-force-theme', { detail: 'light' }));
  }, []);

  return (
    <div id="main-content">
      <div className="sanji-module-page">
        <a href="#main-content" className="oracle-skip-link">跳转到主要内容</a>
        <MetisHeader />

        <div className="max-w-3xl mx-auto px-6 pt-24">
          <Link
            href={category.href}
            style={{ fontSize: 14, color: '#000', textDecoration: 'none', letterSpacing: '0.08em' }}
          >
            ← 返回{category.name} · {category.meaning}
          </Link>
        </div>

        <section
          style={{
            position: 'relative',
            overflow: 'hidden',
            padding: '72px 24px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div aria-hidden="true" style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
            <div
              style={{
                position: 'absolute',
                inset: 0,
                backgroundImage: `url(${sceneSrc})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                opacity: 0.85,
                filter: 'grayscale(1)',
                transition: 'opacity 0.6s ease',
              }}
            />
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background:
                  'linear-gradient(180deg, var(--bg-page,#f7f7f7) 0%, rgba(247,247,247,0.46) 26%, rgba(247,247,247,0.58) 62%, var(--bg-page,#f7f7f7) 100%)',
              }}
            />
          </div>

          <div style={{ position: 'relative', zIndex: 1, width: '100%', textAlign: 'center' }}>
            <div
              style={{
                display: 'inline-block',
                padding: '26px clamp(28px, 6vw, 56px)',
                borderRadius: 20,
                background: 'rgba(16,12,6,0.34)',
                backdropFilter: 'blur(3px)',
                WebkitBackdropFilter: 'blur(3px)',
                border: '1px solid rgba(255,255,255,0.12)',
              }}
            >
              <div style={{ fontSize: 40, marginBottom: 10, lineHeight: 1, filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.6))' }}>
                {getModuleDisplayIcon(module)}
              </div>
              <div
                style={{
                  fontSize: 14,
                  color: 'rgba(255,255,255,0.9)',
                  letterSpacing: '0.35em',
                  marginBottom: 8,
                  textShadow: '0 1px 8px rgba(0,0,0,0.7)',
                  fontWeight: 600,
                }}
              >
                {module.nameEn.toUpperCase()}
              </div>
              <h1
                style={{
                  fontSize: 'clamp(28px, 5vw, 44px)',
                  fontWeight: 700,
                  color: '#f6efe0',
                  letterSpacing: '0.04em',
                  marginBottom: 10,
                  textShadow: '0 2px 16px rgba(0,0,0,0.7)',
                }}
              >
                {module.name}
              </h1>
              <p
                style={{
                  fontSize: 14,
                  color: 'rgba(255,255,255,0.82)',
                  letterSpacing: '0.1em',
                  marginBottom: 12,
                  textShadow: '0 1px 8px rgba(0,0,0,0.65)',
                  fontWeight: 500,
                }}
              >
                {module.subtitle}
              </p>
              <div
                className="flex flex-wrap items-center justify-center gap-2"
                style={{
                  fontSize: 14,
                  color: 'rgba(255,255,255,0.85)',
                  textShadow: '0 1px 6px rgba(0,0,0,0.6)',
                }}
              >
                <span style={{ border: '1px solid rgba(255,255,255,0.4)', color: '#f6efe0', padding: '2px 10px', borderRadius: 9999 }}>
                  已整理
                </span>
                {module.school && <span>学派：{module.school}</span>}
                {module.lessons && <span>· {module.lessons}</span>}
                <span>· {chapterCount} 章节</span>
              </div>
            </div>
          </div>
        </section>

        <div className="max-w-3xl mx-auto px-6 pb-20">
          {!isPro ? (
          <div
            style={{
              textAlign: 'center',
              padding: '48px 24px',
              border: '1px solid var(--bdr)',
              borderRadius: 14,
              background: 'var(--bg-1)',
              margin: '12px auto 32px',
              maxWidth: 520,
            }}
          >
            <div style={{ fontSize: 22, marginBottom: 10 }}>🔒</div>
            <div style={{ fontSize: 12, letterSpacing: '0.3em', color: 'var(--tx-3)', marginBottom: 8 }}>PROFESSIONAL</div>
            <h3 style={{ fontSize: 17, fontWeight: 800, color: 'var(--tx-0)', margin: '0 0 8px' }}>
              {module.name} · 专业版专属学科
            </h3>
            <p style={{ fontSize: 13, color: 'var(--tx-3)', lineHeight: 1.7, margin: '0 auto 18px', maxWidth: 340 }}>
              登录并升级专业版，解锁{category.name}全部学科内容——纲要简介、逐章精解与倪师讲述原话。
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link
                href="/"
                style={{
                  padding: '10px 22px',
                  fontSize: 14,
                  color: 'var(--tx-1)',
                  border: '1px solid var(--bdr)',
                  borderRadius: 22,
                  textDecoration: 'none',
                }}
              >
                返回首页登录
              </Link>
              <Link
                href="/subscription"
                style={{
                  padding: '10px 26px',
                  fontSize: 14,
                  fontWeight: 600,
                  color: '#fff',
                  background: '#000',
                  borderRadius: 22,
                  textDecoration: 'none',
                }}
              >
                升级专业版 →
              </Link>
            </div>
          </div>
          ) : (
          <div style={{ margin: '12px auto 32px', maxWidth: 720 }}>
            <div style={{ fontSize: 12, letterSpacing: '0.3em', color: 'var(--tx-3)', marginBottom: 12 }}>专业版已解锁 · 章节目录</div>
            <div className="space-y-3">
              {module.chapters.map((chapter, index) => (
                <div
                  key={chapter.id}
                  style={{
                    padding: '16px 18px',
                    border: '1px solid var(--bdr)',
                    borderRadius: 12,
                    background: 'var(--bg-card)',
                  }}
                >
                  <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--tx-0)', marginBottom: 6 }}>
                    {String(index + 1).padStart(2, '0')} · {chapter.title}
                  </div>
                  {chapter.subtitle && (
                    <div style={{ fontSize: 13, color: 'var(--tx-3)', marginBottom: 8 }}>{chapter.subtitle}</div>
                  )}
                  <p style={{ fontSize: 14, color: 'var(--tx-2)', lineHeight: 1.75, margin: 0 }}>{chapter.description}</p>
                </div>
              ))}
            </div>
          </div>
          )}

          <div
            className="rounded-lg px-5 py-4"
            style={{
              background: 'rgba(0,0,0,0.05)',
              border: '1px solid rgba(0,0,0,0.12)',
              marginBottom: 32,
            }}
          >
            <p style={{ fontSize: 14, color: 'var(--tx-3)', lineHeight: 1.8 }}>
              {getModuleDisclaimer(module.category)}
            </p>
          </div>

          <div style={{ marginBottom: 28 }}>
            <div style={{ fontSize: 14, color: '#000', letterSpacing: '0.3em', marginBottom: 6 }}>NEXT · 学习下一步</div>
            <p style={{ fontSize: 14, color: 'var(--tx-2)', lineHeight: 1.7, marginBottom: 14 }}>
              以上是<strong style={{ color: 'var(--tx-1)' }}>{module.name}的纲要脉络</strong>。想真正学进去，按下面的顺序走 ——
            </p>
            <div className="space-y-3">
              {nextSteps.map((step, index) => (
                <Link
                  key={step.href}
                  href={step.href}
                  className="sanji-next-step"
                >
                  <div className="flex items-baseline gap-3">
                    <span style={{ fontSize: 14, fontWeight: 700, color: '#000', flexShrink: 0 }}>
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    <div style={{ flex: 1 }}>
                      <div
                        style={{
                          fontSize: 15,
                          fontWeight: 700,
                          color: 'var(--tx-0)',
                          letterSpacing: '0.04em',
                          marginBottom: 4,
                        }}
                      >
                        {step.title} <span style={{ color: '#000', fontWeight: 400 }}>→</span>
                      </div>
                      <div style={{ fontSize: 14, color: 'var(--tx-2)', lineHeight: 1.7 }}>{step.desc}</div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: 28 }}>
            <div style={{ fontSize: 14, color: '#000', letterSpacing: '0.3em', marginBottom: 12 }}>
              {category.name}其它学科
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {siblings.map(sibling => (
                <Link key={sibling.id} href={`/sanji/${sibling.slug}`} className="sanji-sibling-card">
                  <div className="flex items-center gap-2">
                    <span style={{ fontSize: 16 }}>{getModuleDisplayIcon(sibling)}</span>
                    <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--tx-1)', letterSpacing: '0.05em' }}>
                      {sibling.name}
                    </span>
                  </div>
                  <div style={{ fontSize: 14, color: 'var(--tx-3)', marginTop: 3 }}>
                    {getModuleCardSubtitle(sibling)}
                  </div>
                </Link>
              ))}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Link href={category.href} className="sanji-portal-card sanji-portal-card--primary">
              <div style={{ fontSize: 14, fontWeight: 600, color: '#000', letterSpacing: '0.1em' }}>← {category.name}门户</div>
              <div style={{ fontSize: 14, color: 'var(--tx-3)', marginTop: 2 }}>{category.meaning} · 全部学科</div>
            </Link>
            <Link href="/library" className="sanji-portal-card">
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--tx-1)', letterSpacing: '0.1em' }}>本纪原典 →</div>
              <div style={{ fontSize: 14, color: 'var(--tx-3)', marginTop: 2 }}>古籍原文 · 四层精解</div>
            </Link>
          </div>
        </div>

        <footer className="sanji-module-footer">
          <p>
            {category.name} · {module.name} · 基于倪海夏正宗体系 · 仅供学习参考
          </p>
          <p>
            <Link href="/">首页</Link>
            <span> · </span>
            <Link href="/tianji">天纪</Link>
            <span> · </span>
            <Link href="/diji">地纪</Link>
            <span> · </span>
            <Link href="/renji">人纪</Link>
          </p>
        </footer>
      </div>
    </div>
  );
}
