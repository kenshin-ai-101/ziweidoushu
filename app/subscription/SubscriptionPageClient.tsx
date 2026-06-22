'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useState } from 'react';
import LoginModal from '@/components/LoginModal';
import { MembershipEditionButton } from '@/components/MembershipEditionButton';
import { PlanBenefitIcon } from '@/components/subscription/PlanBenefitIcon';
import { applyAuthUser, invalidateAuthCache, fetchCurrentUser } from '@/lib/auth/client';
import type { PublicUser } from '@/lib/auth/types';
import { useAuth } from '@/hooks/use-auth';
import {
  FREE_PLAN_BENEFITS,
  PRO_DISCOUNT_LABEL,
  PRO_LIST_PRICE_CENTS,
  PRO_PLAN_BENEFITS,
  PRO_SALE_PRICE_CENTS,
  formatPriceYuan,
} from '@/lib/subscription/plans';

function getSafeRedirect(value?: string | null) {
  if (!value || !value.startsWith('/') || value.startsWith('//')) return '/';
  return value;
}

export default function SubscriptionPageClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = getSafeRedirect(searchParams.get('redirect'));
  const { isLoggedIn, isPro, loading: authLoading } = useAuth();
  const [loginOpen, setLoginOpen] = useState(false);
  const [paying, setPaying] = useState(false);
  const [querying, setQuerying] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [pendingOrderId, setPendingOrderId] = useState<string | null>(null);

  const afterAuthSuccess = useCallback(() => {
    setLoginOpen(false);
  }, []);

  const syncUserFromResponse = async (data: { user?: PublicUser | null }) => {
    if (data.user) {
      applyAuthUser(data.user);
      return;
    }
    invalidateAuthCache();
    await fetchCurrentUser();
  };

  const checkout = async () => {
    if (!isLoggedIn) {
      setLoginOpen(true);
      return;
    }
    if (isPro) {
      router.push(redirect);
      return;
    }
    setPaying(true);
    setMessage(null);
    try {
      const res = await fetch('/api/subscription/checkout', {
        method: 'POST',
        credentials: 'include',
      });
      const data = await res.json().catch(() => ({})) as {
        success?: boolean;
        status?: string;
        orderId?: string;
        message?: string;
        error?: string;
        user?: PublicUser;
      };
      if (!res.ok) {
        throw new Error(data.error || '创建订单失败');
      }
      if (data.orderId) setPendingOrderId(data.orderId);
      await syncUserFromResponse(data);
      if (data.status === 'paid' || data.success) {
        setMessage(data.message || '专业版已开通');
        window.setTimeout(() => router.push(redirect), 800);
        return;
      }
      setMessage(data.message || '订单已创建，请完成支付后点击「查询订单」');
    } catch (err) {
      setMessage(err instanceof Error ? err.message : '支付发起失败');
    } finally {
      setPaying(false);
    }
  };

  const queryOrder = async () => {
    if (!isLoggedIn) {
      setLoginOpen(true);
      return;
    }
    setQuerying(true);
    setMessage(null);
    try {
      const res = await fetch('/api/subscription/query-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(pendingOrderId ? { orderId: pendingOrderId } : {}),
      });
      const data = await res.json().catch(() => ({})) as {
        success?: boolean;
        status?: string;
        message?: string;
        error?: string;
        user?: PublicUser;
      };
      if (data.status === 'not_found') {
        setMessage(data.message || '未找到待支付订单');
        return;
      }
      if (!res.ok || !data.success) {
        throw new Error(data.error || data.message || '查询失败');
      }
      await syncUserFromResponse(data);
      setMessage(data.message || '专业版已开通');
      window.setTimeout(() => router.push(redirect), 800);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : '查询订单失败');
    } finally {
      setQuerying(false);
    }
  };

  return (
    <div style={{ background: 'var(--bg-page)', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
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
          <span style={{ color: '#d4d4d4', fontSize: 'var(--fs-10)' }}>·</span>
          <Link className="obys-pill-link" style={{ fontSize: 'clamp(11px, 1.1vw, 13px)', padding: 'clamp(3px, 0.4vw, 4px) clamp(6px, 1vw, 10px)' }} href="/account">
            账户
          </Link>
          <MembershipEditionButton variant="home" />
        </div>
      </header>

      <main id="main-content" style={{ flex: 1, paddingTop: 'clamp(80px, 12vh, 140px)', paddingBottom: 40 }}>
        <div style={{ textAlign: 'center', paddingTop: 'clamp(24px, 4.5vh, 52px)' }}>
          <h1 style={{ fontSize: 'clamp(30px, 4.5vw, 52px)', fontWeight: 900, color: '#000', margin: 0, letterSpacing: '-0.01em', lineHeight: 1.1 }}>
            专业版
          </h1>
          <div style={{ fontSize: 'clamp(12px, 1.3vw, 14px)', letterSpacing: '0.25em', color: '#aaa', marginTop: 10 }}>
            METIS PRO
          </div>
        </div>

        <div style={{ marginTop: 'clamp(18px, 3vh, 30px)', marginBottom: 40 }}>
          <div style={{ maxWidth: 880, margin: '0 auto', padding: '0 clamp(16px,3vw,24px)' }}>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))',
                gap: 20,
                maxWidth: 760,
                margin: '0 auto',
                alignItems: 'start',
              }}
            >
              <div style={{ border: '1px solid #e5e5e5', borderRadius: 18, padding: '30px 26px', background: '#fff', display: 'flex', flexDirection: 'column' }}>
                <div style={{ fontSize: 21, fontWeight: 800, color: '#000' }}>免费版</div>
                <div style={{ marginTop: 16, display: 'flex', alignItems: 'baseline' }}>
                  <span style={{ fontSize: 38, fontWeight: 900, color: '#000', lineHeight: 1 }}>¥0</span>
                </div>
                <div style={{ marginTop: 22, padding: 11, textAlign: 'center', borderRadius: 24, border: '1px solid #e5e5e5', color: '#6b6b6b', fontSize: 14, fontWeight: 500 }}>
                  当前免费使用
                </div>
                <div style={{ marginTop: 26, display: 'flex', flexDirection: 'column', gap: 13 }}>
                  {FREE_PLAN_BENEFITS.map(benefit => (
                    <div key={benefit.text} style={{ display: 'flex', alignItems: 'flex-start', gap: 11, fontSize: 13.5, color: '#333', lineHeight: 1.55 }}>
                      <PlanBenefitIcon icon={benefit.icon} tone="free" />
                      <span>{benefit.text}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div
                style={{
                  border: '1.5px solid #d4a843',
                  borderRadius: 18,
                  padding: '30px 26px',
                  background: '#fff',
                  display: 'flex',
                  flexDirection: 'column',
                  position: 'relative',
                  boxShadow: '0 10px 36px rgba(212,168,67,0.14)',
                }}
              >
                <div style={{ position: 'absolute', top: 18, right: 18, fontSize: 11, fontWeight: 700, color: '#000', background: 'linear-gradient(135deg,#f0d488,#d4a843)', padding: '3px 11px', borderRadius: 999, letterSpacing: '0.05em' }}>
                  永久
                </div>
                <div style={{ fontSize: 21, fontWeight: 800, color: '#000' }}>专业版</div>
                <div style={{ marginTop: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 18, color: '#bbb', textDecoration: 'line-through' }}>¥{formatPriceYuan(PRO_LIST_PRICE_CENTS)}</span>
                    <span style={{ fontSize: 20, fontWeight: 600, color: '#c0392b' }}>¥</span>
                    <span style={{ fontSize: 42, fontWeight: 900, color: '#c0392b', lineHeight: 1 }}>{formatPriceYuan(PRO_SALE_PRICE_CENTS)}</span>
                    <span style={{ fontSize: 12, fontWeight: 800, color: '#fff', background: '#c0392b', padding: '3px 9px', borderRadius: 999, marginLeft: 6 }}>
                      {PRO_DISCOUNT_LABEL}
                    </span>
                  </div>
                </div>
                <div style={{ marginTop: 22, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <button
                    type="button"
                    onClick={() => void checkout()}
                    disabled={paying || authLoading || isPro}
                    style={{
                      padding: 12,
                      borderRadius: 24,
                      border: '1px solid #07c160',
                      background: isPro ? '#e8e8e8' : '#07c160',
                      color: isPro ? '#666' : '#fff',
                      fontSize: 15,
                      fontWeight: 700,
                      cursor: paying || isPro ? 'default' : 'pointer',
                      opacity: paying ? 0.7 : 1,
                    }}
                  >
                    {isPro ? '已开通专业版' : paying ? '处理中…' : '支付'}
                  </button>
                </div>
                <div style={{ marginTop: 26, display: 'flex', flexDirection: 'column', gap: 13 }}>
                  {PRO_PLAN_BENEFITS.map(benefit => (
                    <div key={benefit.text} style={{ display: 'flex', alignItems: 'flex-start', gap: 11, fontSize: 13.5, color: '#333', lineHeight: 1.55 }}>
                      <PlanBenefitIcon icon={benefit.icon} tone="pro" />
                      <span>{benefit.text}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div style={{ maxWidth: 760, margin: '28px auto 0', textAlign: 'center' }}>
              <p style={{ fontSize: 13, color: '#888', margin: '0 0 10px' }}>
                付款遇到问题？
              </p>
              <p style={{ fontSize: 13, color: '#666', lineHeight: 1.7, margin: '0 0 16px' }}>
                已付款但没自动开通？刷新或重新登录即可生效，款项不会丢失。
              </p>
              {message && (
                <p style={{ fontSize: 13, color: '#0a7d2c', marginBottom: 12 }}>{message}</p>
              )}
              <button
                type="button"
                onClick={() => void queryOrder()}
                disabled={querying}
                style={{
                  padding: '10px 22px',
                  borderRadius: 24,
                  border: '1px solid #ccc',
                  background: '#fff',
                  color: '#333',
                  fontSize: 14,
                  cursor: querying ? 'wait' : 'pointer',
                }}
              >
                {querying ? '查询中…' : '我已支付 · 查询订单'}
              </button>
            </div>
          </div>
        </div>

        <div style={{ textAlign: 'center', marginTop: 24 }}>
          <Link href={redirect} style={{ fontSize: 14, color: '#666', textDecoration: 'none' }}>
            ← 返回首页
          </Link>
        </div>
      </main>

      <footer style={{ padding: '32px 20px 40px', textAlign: 'center', fontSize: 12, color: '#999', lineHeight: 1.8 }}>
        <p style={{ margin: '0 0 12px', maxWidth: 720, marginInline: 'auto' }}>
          本平台基于中国传统文化研究，仅供学习参考，不构成医疗、投资、婚姻、法律或重大决策建议。AI 输出非医疗诊断。
        </p>
        <p style={{ margin: 0 }}>
          <Link href="/privacy" style={{ color: '#999' }}>隐私政策</Link>
          {' · '}
          <Link href="/terms" style={{ color: '#999' }}>服务条款</Link>
        </p>
      </footer>

      <LoginModal open={loginOpen} onClose={() => setLoginOpen(false)} onSuccess={afterAuthSuccess} />
    </div>
  );
}
