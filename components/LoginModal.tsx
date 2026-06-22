'use client';

import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useTheme } from '@/components/ThemeProvider';
import { encodeClientPassword, applyAuthUser, fetchCurrentUser, invalidateAuthCache } from '@/lib/auth/client';
import type { PublicUser } from '@/lib/auth/types';
import { showOracleToast } from '@/components/OracleToast';

type LoginTab = 'phone' | 'login' | 'register';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^1[3-9]\d{9}$/;

interface LoginModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function LoginModal({ open, onClose, onSuccess }: LoginModalProps) {
  const { theme } = useTheme();
  const dark = theme === 'dark';
  const [mounted, setMounted] = useState(false);

  const [tab, setTab] = useState<LoginTab>('phone');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [devCodeHint, setDevCodeHint] = useState('');
  const [countdown, setCountdown] = useState(0);
  const [sending, setSending] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successText, setSuccessText] = useState('');
  const [agreed, setAgreed] = useState(false);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const resetFields = useCallback(() => {
    setError('');
    setEmail('');
    setPhone('');
    setPassword('');
    setCode('');
    setDevCodeHint('');
  }, []);

  const handleClose = useCallback(() => {
    onClose();
    window.setTimeout(resetFields, 300);
  }, [onClose, resetFields]);

  const switchTab = useCallback((next: LoginTab) => {
    setTab(next);
    setError('');
    setEmail('');
    setPhone('');
    setPassword('');
    setCode('');
    setDevCodeHint('');
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') handleClose();
    };
    document.addEventListener('keydown', onKeyDown);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, handleClose]);

  useEffect(() => {
    if (countdown <= 0) {
      if (timerRef.current) window.clearInterval(timerRef.current);
      return;
    }
    timerRef.current = window.setInterval(() => {
      setCountdown(value => (value <= 1 ? 0 : value - 1));
    }, 1000);
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
    };
  }, [countdown]);

  const validEmail = EMAIL_REGEX.test(email);
  const validPhone = PHONE_REGEX.test(phone);
  const validPassword = password.length >= 6;
  const sendDisabled = countdown > 0 || sending;

  const sendPhoneCode = async () => {
    if (!validPhone) {
      setError('请输入正确的手机号');
      return;
    }
    setError('');
    setSending(true);
    try {
      const res = await fetch('/api/auth/send-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ phone, purpose: 'login' }),
      });
      const data = await res.json().catch(() => ({})) as { success?: boolean; error?: string; devCode?: string };
      if (!res.ok || !data.success) throw new Error(data.error ?? '验证码发送失败');
      setCountdown(60);
      if (data.devCode) setDevCodeHint(String(data.devCode));
    } catch (err) {
      setError(err instanceof Error ? err.message : '验证码发送失败，请稍后重试');
    } finally {
      setSending(false);
    }
  };

  const verifyPhone = async () => {
    if (!validPhone) {
      setError('请输入正确的手机号');
      return;
    }
    if (!/^\d{6}$/.test(code)) {
      setError('请输入 6 位验证码');
      return;
    }
    if (!agreed) {
      setError('请先阅读并勾选同意《隐私政策》《服务条款》');
      return;
    }
    setError('');
    setSubmitting(true);
    try {
      const res = await fetch('/api/auth/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ phone, code }),
      });
      const data = await res.json().catch(() => ({})) as { success?: boolean; error?: string; isNewUser?: boolean; user?: PublicUser };
      if (!res.ok || !data.success) throw new Error(data.error ?? '登录失败，请检查验证码');
      if (data.user) applyAuthUser(data.user);
      else invalidateAuthCache();
      await fetchCurrentUser();
      setSuccessText(data.isNewUser ? '注册成功' : '登录成功');
      window.setTimeout(() => {
        onSuccess?.();
        handleClose();
        showOracleToast(data.isNewUser ? '注册成功，欢迎加入' : '您的账号已登录成功');
      }, 900);
    } catch (err) {
      setError(err instanceof Error ? err.message : '登录失败，请稍后重试');
    } finally {
      setSubmitting(false);
    }
  };

  const sendEmailCode = async () => {
    if (!validEmail) {
      setError('请输入正确的邮箱');
      return;
    }
    setError('');
    setSending(true);
    try {
      const res = await fetch('/api/auth/send-email-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email }),
      });
      const data = await res.json().catch(() => ({})) as { success?: boolean; error?: string; devCode?: string };
      if (!res.ok || !data.success) throw new Error(data.error ?? '验证码发送失败');
      setCountdown(60);
      if (data.devCode) setDevCodeHint(String(data.devCode));
    } catch (err) {
      setError(err instanceof Error ? err.message : '验证码发送失败，请稍后重试');
    } finally {
      setSending(false);
    }
  };

  const loginWithPassword = async () => {
    if (!validEmail) {
      setError('请输入正确的邮箱');
      return;
    }
    if (!validPassword) {
      setError('密码至少 6 位');
      return;
    }
    setError('');
    setSubmitting(true);
    try {
      const res = await fetch('/api/auth/login-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, p: encodeClientPassword(password) }),
      });
      const data = await res.json().catch(() => ({})) as { success?: boolean; error?: string; user?: PublicUser };
      if (!res.ok || !data.success) throw new Error(data.error ?? '登录失败，请检查邮箱或密码');
      if (data.user) applyAuthUser(data.user);
      else invalidateAuthCache();
      await fetchCurrentUser();
      setSuccessText('登录成功');
      window.setTimeout(() => {
        onSuccess?.();
        handleClose();
        showOracleToast('您的账号已登录成功');
      }, 900);
    } catch (err) {
      setError(err instanceof Error ? err.message : '登录失败，请稍后重试');
    } finally {
      setSubmitting(false);
    }
  };

  const registerWithEmail = async () => {
    if (!validEmail) {
      setError('请输入正确的邮箱');
      return;
    }
    if (!validPassword) {
      setError('请设置至少 6 位密码');
      return;
    }
    if (!/^\d{6}$/.test(code)) {
      setError('请输入 6 位验证码');
      return;
    }
    if (!agreed) {
      setError('请先阅读并勾选同意《隐私政策》《服务条款》');
      return;
    }
    setError('');
    setSubmitting(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, p: encodeClientPassword(password), code }),
      });
      const data = await res.json().catch(() => ({})) as { success?: boolean; error?: string; user?: PublicUser };
      if (!res.ok || !data.success) throw new Error(data.error ?? '注册失败，请稍后重试');
      if (data.user) applyAuthUser(data.user);
      else invalidateAuthCache();
      await fetchCurrentUser();
      setSuccessText('注册成功');
      window.setTimeout(() => {
        onSuccess?.();
        handleClose();
        showOracleToast('注册成功，欢迎加入');
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : '注册失败，请稍后重试');
    } finally {
      setSubmitting(false);
    }
  };

  if (!mounted) return null;

  const border = dark ? 'rgba(255,255,255,0.16)' : 'rgba(0,0,0,0.12)';
  const text = dark ? '#f0f0f0' : '#1a1a1a';
  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '11px 12px',
    fontSize: 14,
    border: `1px solid ${dark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.18)'}`,
    borderRadius: 8,
    background: dark ? 'rgba(255,255,255,0.06)' : '#ffffff',
    color: text,
    outline: 'none',
    fontFamily: 'inherit',
    boxSizing: 'border-box',
  };

  const title = tab === 'login' ? '邮箱登录' : tab === 'register' ? '注册' : '手机登录';
  const onSubmit = tab === 'login' ? loginWithPassword : tab === 'register' ? registerWithEmail : verifyPhone;
  const needsAgreement = tab === 'phone' || tab === 'register';

  return createPortal(
    open ? (
      <div
        onClick={handleClose}
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 9999,
          background: 'rgba(0,0,0,0.58)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'center',
          padding: '24px 16px',
          overflowY: 'auto',
        }}
      >
        <div
          onClick={event => event.stopPropagation()}
          role="dialog"
          aria-modal="true"
          aria-labelledby="login-modal-title"
          style={{
            width: '100%',
            maxWidth: 400,
            margin: 'auto',
            borderRadius: 16,
            border: `1px solid ${border}`,
            background: dark ? '#161616' : '#ffffff',
            padding: '20px 22px 18px',
            boxShadow: dark ? '0 24px 60px rgba(0,0,0,0.6)' : '0 24px 60px rgba(0,0,0,0.28)',
            color: text,
          }}
        >
          {successText ? (
            <div style={{ textAlign: 'center', padding: '28px 8px 22px', position: 'relative' }}>
              <button type="button" onClick={handleClose} aria-label="关闭" style={{ position: 'absolute', top: -4, right: -4, background: 'transparent', border: 'none', cursor: 'pointer', color: text, fontSize: 22, opacity: 0.6 }}>×</button>
              <div style={{ width: 60, height: 60, margin: '0 auto 16px', borderRadius: '50%', background: '#22a06b', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, color: '#fff', fontWeight: 700 }}>✓</div>
              <div style={{ fontSize: 19, fontWeight: 700 }}>{successText}！</div>
              <div style={{ fontSize: 13, opacity: 0.6, marginTop: 8 }}>正在为你进入…</div>
            </div>
          ) : (
            <>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                <h3 id="login-modal-title" style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>{title}</h3>
                <button type="button" onClick={handleClose} aria-label="关闭" style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: text, fontSize: 22, opacity: 0.6 }}>×</button>
              </div>

              <div style={{ display: 'flex', gap: 4, marginBottom: 14, padding: 3, background: dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)', borderRadius: 10 }}>
                {(['phone', 'login', 'register'] as LoginTab[]).map(item => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => switchTab(item)}
                    style={{
                      flex: 1,
                      padding: 8,
                      fontSize: 13,
                      fontWeight: 600,
                      border: 'none',
                      borderRadius: 8,
                      cursor: 'pointer',
                      background: tab === item ? (dark ? '#fff' : '#000') : 'transparent',
                      color: tab === item ? (dark ? '#000' : '#fff') : text,
                    }}
                  >
                    {item === 'login' ? '邮箱登录' : item === 'register' ? '注册' : '手机登录'}
                  </button>
                ))}
              </div>

              {tab === 'phone' ? (
                <>
                  <input type="tel" inputMode="numeric" autoComplete="tel" value={phone} onChange={event => setPhone(event.target.value.replace(/\D/g, '').slice(0, 11))} placeholder="请输入手机号" maxLength={11} style={inputStyle} autoFocus aria-label="手机号" />
                  <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                    <input type="text" inputMode="numeric" autoComplete="one-time-code" value={code} onChange={event => setCode(event.target.value.replace(/\D/g, '').slice(0, 6))} onKeyDown={event => { if (event.key === 'Enter' && !submitting) void verifyPhone(); }} placeholder="短信验证码" maxLength={6} style={{ ...inputStyle, flex: 1, letterSpacing: '0.2em' }} aria-label="短信验证码" />
                    <button type="button" onClick={() => void sendPhoneCode()} disabled={sendDisabled} style={{ flexShrink: 0, padding: '0 12px', fontSize: 13, fontWeight: 600, border: `1px solid ${border}`, borderRadius: 8, background: 'transparent', color: text, cursor: sendDisabled ? 'default' : 'pointer', opacity: sendDisabled ? 0.5 : 1 }}>
                      {countdown > 0 ? `${countdown}s 后重发` : sending ? '发送中…' : '获取验证码'}
                    </button>
                  </div>
                  <p style={{ fontSize: 12, color: '#9a9a9a', margin: '7px 2px 0', lineHeight: 1.6 }}>验证码 5 分钟内有效；未注册的手机号将自动创建账号。</p>
                </>
              ) : (
                <>
                  <input type="email" inputMode="email" autoComplete="email" value={email} onChange={event => setEmail(event.target.value.trim())} placeholder="请输入邮箱" style={inputStyle} autoFocus aria-label="邮箱地址" />
                  <input type="password" autoComplete={tab === 'login' ? 'current-password' : 'new-password'} value={password} onChange={event => setPassword(event.target.value)} onKeyDown={event => { if (event.key === 'Enter' && tab === 'login' && !submitting) void loginWithPassword(); }} placeholder={tab === 'login' ? '密码' : '设置密码（6-64 位）'} maxLength={64} style={{ ...inputStyle, marginTop: 10 }} aria-label="密码" />
                </>
              )}

              {tab === 'register' && (
                <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                  <input type="text" inputMode="numeric" autoComplete="one-time-code" value={code} onChange={event => setCode(event.target.value.replace(/\D/g, '').slice(0, 6))} onKeyDown={event => { if (event.key === 'Enter' && !submitting) void registerWithEmail(); }} placeholder="验证码" maxLength={6} style={{ ...inputStyle, flex: 1, letterSpacing: '0.2em' }} aria-label="验证码" />
                  <button type="button" onClick={() => void sendEmailCode()} disabled={sendDisabled} style={{ flexShrink: 0, padding: '0 12px', fontSize: 13, fontWeight: 600, border: `1px solid ${border}`, borderRadius: 8, background: 'transparent', color: text, cursor: sendDisabled ? 'default' : 'pointer', opacity: sendDisabled ? 0.5 : 1 }}>
                    {countdown > 0 ? `${countdown}s 后重发` : sending ? '发送中…' : '获取验证码'}
                  </button>
                </div>
              )}

              {devCodeHint && (
                <p style={{ fontSize: 12, color: '#0a7d2c', margin: '8px 2px 0' }}>开发模式验证码：{devCodeHint}</p>
              )}

              {error && <div style={{ fontSize: 14, color: '#d04040', marginTop: 8 }}>{error}</div>}

              {needsAgreement && (
                <label style={{ display: 'flex', alignItems: 'flex-start', gap: 7, marginTop: 12, fontSize: 12.5, lineHeight: 1.6, cursor: 'pointer' }}>
                  <input type="checkbox" checked={agreed} onChange={event => setAgreed(event.target.checked)} style={{ marginTop: 2, flexShrink: 0, accentColor: '#c89a30' }} aria-label="同意隐私政策与服务条款" />
                  <span>
                    我已阅读并同意{' '}
                    <Link href="/privacy" target="_blank" rel="noopener noreferrer" style={{ color: text, textDecoration: 'underline' }}>《隐私政策》</Link>
                    {' '}与{' '}
                    <Link href="/terms" target="_blank" rel="noopener noreferrer" style={{ color: text, textDecoration: 'underline' }}>《服务条款》</Link>
                  </span>
                </label>
              )}

              <button
                type="button"
                onClick={() => void onSubmit()}
                disabled={submitting || (needsAgreement && !agreed)}
                style={{
                  width: '100%',
                  marginTop: 14,
                  padding: '11px 14px',
                  fontSize: 14,
                  fontWeight: 600,
                  border: `1px solid ${border}`,
                  borderRadius: 8,
                  background: dark ? '#ffffff' : '#000000',
                  color: dark ? '#000000' : '#ffffff',
                  cursor: submitting ? 'wait' : 'pointer',
                  opacity: submitting || (needsAgreement && !agreed) ? 0.6 : 1,
                }}
              >
                {submitting
                  ? (tab === 'register' ? '注册中…' : '登录中…')
                  : (tab === 'login' ? '登录' : tab === 'register' ? '注册' : '验证并登录')}
              </button>

              <div style={{ fontSize: 12, opacity: 0.55, textAlign: 'center', marginTop: 12, lineHeight: 1.6 }}>
                {tab === 'login' ? '没有账号？点上方“注册”' : tab === 'register' ? '注册后即可用邮箱+密码登录' : '手机号验证即登录，无需设置密码'}
              </div>
            </>
          )}
        </div>
      </div>
    ) : null,
    document.body,
  );
}
