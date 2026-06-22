'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import type { AccountQuotaResponse } from '@/lib/auth/account-quota';
import {
  encodeClientPassword,
  applyAuthUser,
  getMembershipStatusLabel,
  invalidateAuthCache,
  maskPhone,
} from '@/lib/auth/client';
import { useAuth } from '@/hooks/use-auth';
import { subscribeSharedQuotaStore } from '@/lib/subscription/shared-quota-client';

const PHONE_REGEX = /^1[3-9]\d{9}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const pageStyle = {
  minHeight: '100vh',
  background: 'var(--bg-0)',
  color: 'var(--tx-1)',
  fontFamily: 'var(--font-sans)',
} as const;

const cardStyle = {
  background: 'var(--bg-card)',
  border: '1px solid var(--bdr)',
  borderRadius: 'var(--r-lg)',
  padding: '20px 22px',
  marginBottom: 18,
  boxShadow: 'var(--sh-sm)',
} as const;

const sectionTitleStyle = {
  fontSize: 13,
  fontWeight: 700,
  letterSpacing: '0.06em',
  color: 'var(--tx-3)',
  marginBottom: 8,
} as const;

const primaryBtnStyle = {
  width: '100%',
  padding: '12px',
  fontSize: 14,
  fontWeight: 600,
  color: '#fff',
  background: '#000',
  border: '1px solid #000',
  borderRadius: 12,
  cursor: 'pointer',
} as const;

const outlineBtnStyle = {
  padding: '8px 16px',
  fontSize: 13,
  color: 'var(--tx-2)',
  background: 'transparent',
  border: '1px solid var(--bdr-med)',
  borderRadius: 999,
  cursor: 'pointer',
} as const;

const inputStyle = {
  width: '100%',
  padding: '11px 44px 11px 14px',
  fontSize: 14,
  color: 'var(--tx-1)',
  background: 'var(--bg-0)',
  border: '1px solid var(--bdr-med)',
  borderRadius: 10,
  outline: 'none',
  boxSizing: 'border-box' as const,
};

function InfoRow({
  label,
  value,
  muted,
  badge,
}: {
  label: string;
  value: string;
  muted?: boolean;
  badge?: boolean;
}) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '12px 0',
        borderBottom: '1px solid var(--bdr)',
      }}
    >
      <span style={{ fontSize: 14, color: 'var(--tx-3)' }}>{label}</span>
      <span
        style={{
          fontSize: badge ? 12 : 14,
          fontWeight: badge ? 700 : muted ? 500 : 500,
          color: muted ? 'var(--tx-3)' : badge ? '#fff' : 'var(--tx-1)',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          maxWidth: '60%',
          whiteSpace: 'nowrap',
          ...(badge
            ? {
                background: '#000',
                padding: '3px 10px',
                borderRadius: 999,
              }
            : {}),
        }}
      >
        {value}
      </span>
    </div>
  );
}

function BindChannelRow({
  kind,
  current,
  onDone,
}: {
  kind: 'phone' | 'email';
  current: string | null;
  onDone: () => void;
}) {
  const isPhone = kind === 'phone';
  const label = isPhone ? '手机号' : '邮箱';
  const hasCurrent = Boolean(current);
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [countdown, setCountdown] = useState(0);
  const [sending, setSending] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [devCode, setDevCode] = useState('');
  const [message, setMessage] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = window.setTimeout(() => setCountdown(countdown - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [countdown]);

  const resetForm = () => {
    setValue('');
    setCode('');
    setPassword('');
    setDevCode('');
    setMessage(null);
  };

  const sendCode = async () => {
    const target = value.trim();
    if (isPhone ? !PHONE_REGEX.test(target) : !EMAIL_REGEX.test(target)) {
      setMessage({ type: 'err', text: isPhone ? '请输入正确的手机号' : '请输入正确的邮箱' });
      return;
    }
    setSending(true);
    setMessage(null);
    try {
      const res = await fetch(isPhone ? '/api/auth/send-code' : '/api/auth/send-email-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(
          isPhone ? { phone: target, purpose: 'bind' } : { email: target },
        ),
      });
      const data = await res.json().catch(() => ({})) as { success?: boolean; error?: string; devCode?: string };
      if (!res.ok || !data.success) throw new Error(data.error || '验证码发送失败');
      if (data.devCode) setDevCode(String(data.devCode));
      setCountdown(60);
      setMessage({ type: 'ok', text: '验证码已发送' });
    } catch (err) {
      setMessage({ type: 'err', text: err instanceof Error ? err.message : '验证码发送失败' });
    } finally {
      setSending(false);
    }
  };

  const submitBind = async () => {
    const target = value.trim();
    if (isPhone ? !PHONE_REGEX.test(target) : !EMAIL_REGEX.test(target)) {
      setMessage({ type: 'err', text: isPhone ? '请输入正确的手机号' : '请输入正确的邮箱' });
      return;
    }
    if (!/^\d{6}$/.test(code.trim())) {
      setMessage({ type: 'err', text: '请输入 6 位验证码' });
      return;
    }
    if (!isPhone && !hasCurrent && password && (password.length < 6 || password.length > 64)) {
      setMessage({ type: 'err', text: '请设置 6–64 位登录密码' });
      return;
    }

    setSubmitting(true);
    setMessage(null);
    try {
      const payload: Record<string, string> = {
        [isPhone ? 'phone' : 'email']: isPhone ? target : target.toLowerCase(),
        code: code.trim(),
      };
      if (!isPhone && password) payload.p = encodeClientPassword(password);

      const res = await fetch(isPhone ? '/api/auth/bind-phone' : '/api/auth/bind-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({})) as { success?: boolean; error?: string; user?: import('@/lib/auth/types').PublicUser };
      if (!res.ok || !data.success) throw new Error(data.error || '绑定失败');

      setMessage({ type: 'ok', text: `已${hasCurrent ? '更换' : '绑定'}${label}` });
      resetForm();
      setOpen(false);
      if (data.user) applyAuthUser(data.user);
      else invalidateAuthCache();
      onDone();
    } catch (err) {
      setMessage({ type: 'err', text: err instanceof Error ? err.message : '绑定失败，请重试' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ marginTop: 12 }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '12px 0',
          borderBottom: '1px solid var(--bdr)',
        }}
      >
        <div>
          <div style={{ fontSize: 14, color: 'var(--tx-1)', fontWeight: 500 }}>
            {hasCurrent ? `更换${label}` : `绑定${label}`}
          </div>
          <div style={{ fontSize: 12.5, color: 'var(--tx-3)', marginTop: 4 }}>
            当前：{hasCurrent ? (isPhone ? maskPhone(current!) : current) : '未绑定'}
          </div>
        </div>
        <button
          type="button"
          onClick={() => {
            setOpen(prev => !prev);
            if (open) resetForm();
          }}
          style={{
            ...outlineBtnStyle,
            padding: '6px 14px',
            fontSize: 12,
          }}
        >
          {open ? '收起' : hasCurrent ? '更换' : '绑定'}
        </button>
      </div>

      {open && (
        <div style={{ paddingTop: 12, display: 'grid', gap: 8 }}>
          <input
            type={isPhone ? 'tel' : 'email'}
            value={value}
            onChange={e => setValue(e.target.value)}
            placeholder={hasCurrent ? (isPhone ? '新手机号' : '新邮箱') : (isPhone ? '手机号' : '邮箱')}
            style={{ ...inputStyle, paddingRight: 14 }}
          />
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              type="text"
              inputMode="numeric"
              value={code}
              onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="6 位验证码"
              style={{ ...inputStyle, paddingRight: 14, flex: 1 }}
            />
            <button
              type="button"
              onClick={() => void sendCode()}
              disabled={sending || countdown > 0}
              style={{
                ...outlineBtnStyle,
                whiteSpace: 'nowrap',
                opacity: sending || countdown > 0 ? 0.6 : 1,
              }}
            >
              {countdown > 0 ? `${countdown}s` : sending ? '发送中…' : '获取验证码'}
            </button>
          </div>
          {!isPhone && !hasCurrent && (
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="设置登录密码（邮箱登录用，6–64 位，可选）"
              style={{ ...inputStyle, paddingRight: 14 }}
            />
          )}
          {devCode && (
            <p style={{ fontSize: 12, color: 'var(--tx-3)' }}>开发模式验证码：{devCode}</p>
          )}
          {message && (
            <p style={{ fontSize: 13, color: message.type === 'ok' ? '#0a7d2c' : '#d04040' }}>
              {message.text}
            </p>
          )}
          <button
            type="button"
            onClick={() => void submitBind()}
            disabled={submitting}
            style={{ ...primaryBtnStyle, opacity: submitting ? 0.6 : 1 }}
          >
            {submitting ? '提交中…' : hasCurrent ? `确认更换${label}` : `确认绑定${label}`}
          </button>
        </div>
      )}
    </div>
  );
}

export default function AccountPageClient({
  initialQuota,
}: {
  initialQuota: AccountQuotaResponse | null;
}) {
  const router = useRouter();
  const { user, loading, isLoggedIn, isPro } = useAuth();
  const [quota, setQuota] = useState<AccountQuotaResponse | null>(initialQuota);
  const [loggingOut, setLoggingOut] = useState(false);
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [passwordBusy, setPasswordBusy] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  useEffect(() => {
    if (!isLoggedIn) {
      setQuota(null);
      return;
    }

    let active = true;

    const refreshQuota = () => {
      fetch('/api/quota', { credentials: 'include' })
        .then(res => (res.ok ? res.json() : null))
        .then(data => {
          if (active && data) setQuota(data as AccountQuotaResponse);
        })
        .catch(() => {});
    };

    refreshQuota();
    const unsubscribe = subscribeSharedQuotaStore(refreshQuota);

    return () => {
      active = false;
      unsubscribe();
    };
  }, [isLoggedIn, isPro]);

  const membershipLabel = getMembershipStatusLabel(isPro);

  const logout = async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    } catch {
      /* ignore */
    } finally {
      invalidateAuthCache();
      router.push('/');
    }
  };

  const changePassword = async () => {
    if (password.length < 6 || password.length > 64) {
      setPasswordMessage({ type: 'err', text: '密码需 6–64 位' });
      return;
    }
    if (password !== passwordConfirm) {
      setPasswordMessage({ type: 'err', text: '两次输入的密码不一致' });
      return;
    }
    setPasswordBusy(true);
    setPasswordMessage(null);
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          p: encodeClientPassword(password),
          p2: encodeClientPassword(passwordConfirm),
        }),
      });
      const data = await res.json().catch(() => ({})) as { success?: boolean; error?: string };
      if (!res.ok || !data.success) {
        setPasswordMessage({ type: 'err', text: data.error || '修改失败，请重试' });
        return;
      }
      setPasswordMessage({ type: 'ok', text: '✓ 密码已修改，下次登录请用新密码' });
      setPassword('');
      setPasswordConfirm('');
    } catch {
      setPasswordMessage({ type: 'err', text: '网络错误，请稍后再试' });
    } finally {
      setPasswordBusy(false);
    }
  };

  if (loading) {
    return (
      <div style={pageStyle}>
        <div style={{ padding: 80, textAlign: 'center', color: 'var(--tx-3)' }}>加载中…</div>
      </div>
    );
  }

  if (!isLoggedIn || !user) {
    return (
      <div style={pageStyle}>
        <main style={{ maxWidth: 480, margin: '120px auto', padding: '0 20px', textAlign: 'center' }}>
          <p style={{ color: 'var(--tx-2)', marginBottom: 20 }}>你还没登录</p>
          <button type="button" onClick={() => router.push('/')} style={{ ...primaryBtnStyle, maxWidth: 240, margin: '0 auto' }}>
            返回首页登录 »
          </button>
        </main>
      </div>
    );
  }

  return (
    <div style={pageStyle}>
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '18px 24px',
          borderBottom: '1px solid var(--bdr)',
        }}
      >
        <button
          type="button"
          onClick={() => router.push('/')}
          aria-label="回到首页"
          style={{
            fontWeight: 800,
            fontSize: 20,
            letterSpacing: '-0.02em',
            cursor: 'pointer',
            background: 'none',
            border: 'none',
            padding: 0,
          }}
        >
          METIS
        </button>
        <button type="button" onClick={() => router.push('/')} style={outlineBtnStyle}>
          ← 返回首页
        </button>
      </header>

      <main id="main-content" style={{ maxWidth: 560, margin: '0 auto', padding: '40px 20px 80px' }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, marginBottom: 28 }}>我的账户</h1>

        <section style={cardStyle}>
          <div style={sectionTitleStyle}>账户信息</div>
          <InfoRow label="登录邮箱" value={user.email || '未绑定'} muted={!user.email} />
          <InfoRow label="登录手机" value={user.phone ? maskPhone(user.phone) : '未绑定'} muted={!user.phone} />
          <InfoRow label="会员状态" value={membershipLabel} badge={isPro} />
        </section>

        <section style={cardStyle}>
          <div style={sectionTitleStyle}>AI 提问额度</div>
          {!quota ? (
            <p style={{ color: 'var(--tx-3)', fontSize: 14, padding: '8px 0' }}>加载中…</p>
          ) : quota.unlimited ? (
            <InfoRow label="提问次数" value="不限次数（已配置自有模型）" />
          ) : (
            <>
              <InfoRow label="今日剩余" value={`${quota.dailyRemaining} / ${quota.max} 次`} />
              <InfoRow
                label="额外（赠送）次数"
                value={`${quota.bonusCredits ?? 0} 次`}
                badge={(quota.bonusCredits ?? 0) > 0}
              />
              <p style={{ color: 'var(--tx-3)', fontSize: 12.5, lineHeight: 1.7, marginTop: 12 }}>
                每日额度按北京时间 0 点重置；额外次数由后台发放、用完即止、不每日恢复。单盘 AI 提问与合盘共用这两份额度。
              </p>
            </>
          )}
        </section>

        <section style={cardStyle}>
          <div style={sectionTitleStyle}>会员 / 订阅</div>
          {isPro ? (
            <p style={{ color: 'var(--tx-2)', fontSize: 14, lineHeight: 1.7 }}>
              你已是专业版会员 —— 全部宫位解读、流月/流日/流时、全盘报告均已解锁。
            </p>
          ) : (
            <>
              <p style={{ color: 'var(--tx-2)', fontSize: 14, lineHeight: 1.7, marginBottom: 14 }}>
                升级专业版 <strong style={{ color: '#000' }}>¥168 永久买断</strong>
                ，解锁全部宫位解读 + 流月/流日/流时 + 全盘报告。
              </p>
              <button type="button" onClick={() => router.push('/subscription')} style={primaryBtnStyle}>
                升级专业版 →
              </button>
            </>
          )}
        </section>

        {isPro && (
          <section style={cardStyle}>
            <div style={sectionTitleStyle}>AI 模型</div>
            <p style={{ color: 'var(--tx-2)', fontSize: 14, lineHeight: 1.7, marginBottom: 14 }}>
              专业版可接入<strong style={{ color: '#000' }}>自己的大模型 API</strong>
              （OpenAI / Claude / DeepSeek 等 OpenAI 兼容端点），用自己的 Key 跑解读，不占平台每日额度。
            </p>
            <button
              type="button"
              onClick={() => router.push('/settings/model')}
              style={{ ...outlineBtnStyle, width: '100%', padding: '11px' }}
            >
              接入自有模型 API →
            </button>
          </section>
        )}

        <section style={cardStyle}>
          <div style={sectionTitleStyle}>账号绑定</div>
          <p style={{ color: 'var(--tx-3)', fontSize: 12.5, lineHeight: 1.7, marginBottom: 4 }}>
            绑定后，手机号与邮箱登录的是<strong style={{ color: 'var(--tx-2)' }}>同一个账号</strong>
            ，会员 / 历史 / 额度共享。
          </p>
          <BindChannelRow kind="phone" current={user.phone ?? null} onDone={invalidateAuthCache} />
          <BindChannelRow kind="email" current={user.email ?? null} onDone={invalidateAuthCache} />
        </section>

        <section style={cardStyle}>
          <div style={sectionTitleStyle}>安全</div>
          <div style={{ marginTop: 16 }}>
            {passwordOpen ? (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <div style={{ fontSize: 14, color: 'var(--tx-2)' }}>修改密码</div>
                  <button
                    type="button"
                    onClick={() => {
                      setPasswordOpen(false);
                      setPassword('');
                      setPasswordConfirm('');
                      setPasswordMessage(null);
                    }}
                    style={{ fontSize: 13, color: 'var(--tx-3)', background: 'none', border: 'none', cursor: 'pointer' }}
                  >
                    收起
                  </button>
                </div>
                <div style={{ position: 'relative', marginBottom: 8 }}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="新密码（6–64 位）"
                    autoComplete="new-password"
                    style={inputStyle}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(prev => !prev)}
                    aria-label={showPassword ? '隐藏密码' : '显示密码'}
                    title={showPassword ? '隐藏密码' : '显示密码'}
                    style={{
                      position: 'absolute',
                      right: 8,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: 4,
                      color: 'var(--tx-3)',
                    }}
                  >
                    {showPassword ? (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-10-7-10-7a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 10 7 10 7a18.5 18.5 0 0 1-2.16 3.19M1 1l22 22M9.9 9.9a3 3 0 0 0 4.2 4.2" />
                      </svg>
                    ) : (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                        <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    )}
                  </button>
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={passwordConfirm}
                  onChange={e => setPasswordConfirm(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && !passwordBusy) void changePassword();
                  }}
                  placeholder="确认新密码"
                  autoComplete="new-password"
                  style={{ ...inputStyle, paddingRight: 14, marginBottom: 8 }}
                />
                {passwordMessage && (
                  <div
                    style={{
                      fontSize: 13,
                      color: passwordMessage.type === 'ok' ? '#0a7d2c' : '#d04040',
                      marginBottom: 8,
                    }}
                  >
                    {passwordMessage.text}
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => void changePassword()}
                  disabled={passwordBusy}
                  style={{ ...primaryBtnStyle, opacity: passwordBusy ? 0.6 : 1 }}
                >
                  {passwordBusy ? '修改中…' : '确认修改'}
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setPasswordOpen(true);
                  setPasswordMessage(null);
                }}
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  textAlign: 'left',
                  fontSize: 14,
                  fontWeight: 500,
                  color: 'var(--tx-1)',
                  background: 'var(--bg-0)',
                  border: '1px solid var(--bdr-med)',
                  borderRadius: 10,
                  cursor: 'pointer',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <span>修改密码</span>
                <span style={{ color: 'var(--tx-3)', fontSize: 18, lineHeight: 1 }}>›</span>
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={() => void logout()}
            disabled={loggingOut}
            style={{
              ...outlineBtnStyle,
              marginTop: 16,
              width: '100%',
              padding: '11px',
              color: '#d04040',
              borderColor: 'rgba(208,64,64,0.35)',
            }}
          >
            {loggingOut ? '退出中…' : '退出登录'}
          </button>
        </section>
      </main>
    </div>
  );
}
