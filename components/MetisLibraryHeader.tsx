'use client';

import Link from 'next/link';
import { useState } from 'react';

const NAV_ITEMS = [
  { href: '/chart', label: '起盘' },
  { href: '/heming', label: '合盘' },
  { href: '/knowledge', label: '知识库' },
  { href: '/library', label: '古籍库' },
];

type MetisLibraryHeaderProps = {
  editionLabel?: string;
  editionHref?: string;
};

export function MetisLibraryHeader({
  editionLabel = '普通版',
  editionHref = '/subscription',
}: MetisLibraryHeaderProps) {
  const [open, setOpen] = useState(false);

  return (
    <header className="metis-library-header">
      <nav
        aria-label="移动端菜单"
        aria-hidden={!open}
        className={`metis-mobile-menu${open ? ' is-open' : ''}`}
      >
        {NAV_ITEMS.map((item, index) => (
          <Link key={item.href} href={item.href} onClick={() => setOpen(false)}>
            <span>{String(index + 1).padStart(2, '0')}</span>
            {item.label}
          </Link>
        ))}
      </nav>

      <Link className="metis-library-logo" aria-label="回到首页" href="/">
        METIS
      </Link>

      <div className="metis-library-actions">
        <nav className="metis-library-nav" aria-label="主导航">
          <span className="metis-library-nav-desktop">
            <Link className="obys-pill-link" href="/chart">起盘</Link>
          </span>
          <span className="metis-library-nav-desktop">
            <span className="metis-library-nav-dot">·</span>
            <Link className="obys-pill-link" href="/heming">合盘</Link>
          </span>
          <Link className="metis-library-edition" href={editionHref}>
            {editionLabel}
          </Link>
          <button
            type="button"
            aria-label={open ? '关闭菜单' : '打开菜单'}
            aria-expanded={open}
            className="metis-library-burger"
            onClick={() => setOpen((value) => !value)}
          >
            {open ? '×' : '☰'}
          </button>
        </nav>
      </div>
    </header>
  );
}
