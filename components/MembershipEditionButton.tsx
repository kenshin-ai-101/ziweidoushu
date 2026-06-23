'use client';

import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';
import { getMembershipEditionLabel } from '@/lib/auth/client';

type MembershipEditionVariant = 'library' | 'obys' | 'oracle' | 'heming' | 'home';

const proHomeStyle = {
  background: '#1a1a1a',
  color: '#d4a843',
  borderColor: '#d4a843',
  fontWeight: 700,
} as const;

export function MembershipEditionButton({
  variant = 'obys',
  className,
}: {
  variant?: MembershipEditionVariant;
  className?: string;
}) {
  const { isPro, loading } = useAuth();
  const label = getMembershipEditionLabel(isPro, loading);

  if (variant === 'library') {
    return (
      <Link className={className ?? 'metis-library-edition'} href="/subscription">
        {label}
      </Link>
    );
  }

  if (variant === 'oracle') {
    return (
      <Link
        className={className ?? 'oracle-subpage-actions-edition'}
        href="/subscription"
        style={isPro ? proHomeStyle : undefined}
      >
        {label}
      </Link>
    );
  }

  if (variant === 'heming') {
    return (
      <Link
        className={className ?? 'heming-obys-btn'}
        href="/subscription"
        style={isPro ? proHomeStyle : undefined}
      >
        {label}
      </Link>
    );
  }

  if (variant === 'home') {
    return (
      <Link
        className={className ?? 'oracle-pro'}
        href="/subscription"
        style={loading ? { opacity: 0.5, pointerEvents: 'none' } : isPro ? proHomeStyle : undefined}
      >
        {label}
      </Link>
    );
  }

  return (
    <Link
      className={className ?? 'obys-btn obys-btn--primary'}
      href="/subscription"
      style={{
        fontSize: 'clamp(11px, 1.1vw, 13px)',
        padding: 'clamp(4px, 0.5vw, 5px) clamp(10px, 1.2vw, 14px)',
        marginLeft: 'clamp(4px, 0.6vw, 8px)',
        background: isPro ? '#1a1a1a' : '#fff',
        color: isPro ? '#d4a843' : '#1a1a1a',
        borderWidth: '1px',
        borderStyle: 'solid',
        borderColor: isPro ? '#d4a843' : 'rgba(0,0,0,0.28)',
        fontWeight: isPro ? 700 : 500,
        textDecoration: 'none',
        display: 'inline-flex',
        alignItems: 'center',
        borderRadius: 999,
      }}
    >
      {label}
    </Link>
  );
}
