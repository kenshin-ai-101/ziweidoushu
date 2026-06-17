'use client';
import { createContext, useContext, useEffect, useState } from 'react';

export type Theme = 'dark' | 'light';

const ThemeContext = createContext<{
  theme: Theme;
  toggle: () => void;
}>({ theme: 'dark', toggle: () => {} });

function readStoredTheme(): Theme {
  if (typeof window === 'undefined') return 'dark';
  const saved = localStorage.getItem('ziwei-theme') as Theme | null;
  if (saved === 'light' || saved === 'dark') return saved;
  const attr = document.documentElement.getAttribute('data-theme');
  if (attr === 'light' || attr === 'dark') return attr;
  return 'dark';
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Keep SSR and the first client render identical; sync real preference after mount.
  const [theme, setTheme] = useState<Theme>('dark');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setTheme(readStoredTheme());
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const root = document.documentElement;
    root.setAttribute('data-theme', theme);
    localStorage.setItem('ziwei-theme', theme);
  }, [theme, mounted]);

  useEffect(() => {
    const forceTheme = (event: Event) => {
      const next = (event as CustomEvent<Theme>).detail;
      if (next === 'light' || next === 'dark') setTheme(next);
    };
    window.addEventListener('ziwei-force-theme', forceTheme);
    return () => window.removeEventListener('ziwei-force-theme', forceTheme);
  }, []);

  const toggle = () => {
    const root = document.documentElement;
    root.classList.add('theme-transitioning');
    setTheme(t => t === 'dark' ? 'light' : 'dark');
    setTimeout(() => root.classList.remove('theme-transitioning'), 420);
  };

  return (
    <ThemeContext.Provider value={{ theme, toggle }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
