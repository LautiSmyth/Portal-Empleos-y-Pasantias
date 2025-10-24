import { useEffect, useState } from 'react';

export type Theme = 'light' | 'dark';

const STORAGE_KEY = 'theme';

function getSystemTheme(): Theme {
  if (typeof window === 'undefined' || !window.matchMedia) return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function getInitialTheme(): { theme: Theme; followsSystem: boolean } {
  try {
    const stored = localStorage.getItem(STORAGE_KEY) as Theme | null;
    if (stored === 'light' || stored === 'dark') {
      return { theme: stored, followsSystem: false };
    }
  } catch {}
  return { theme: getSystemTheme(), followsSystem: true };
}

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  root.setAttribute('data-theme', theme);
  // Optional: Tailwind dark class for any future dark: variants
  if (theme === 'dark') root.classList.add('dark'); else root.classList.remove('dark');
}

export function useTheme() {
  const [{ theme, followsSystem }, setState] = useState(getInitialTheme());

  // Apply on mount and when theme changes
  useEffect(() => {
    applyTheme(theme);
    try { localStorage.setItem(STORAGE_KEY, theme); } catch {}
  }, [theme]);

  // React to system changes only if following system
  useEffect(() => {
    if (!followsSystem || typeof window === 'undefined' || !window.matchMedia) return;
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => setState((s) => ({ ...s, theme: media.matches ? 'dark' : 'light' }));
    media.addEventListener?.('change', handler);
    // Safari/old browsers
    media.addListener?.(handler as any);
    return () => {
      media.removeEventListener?.('change', handler);
      media.removeListener?.(handler as any);
    };
  }, [followsSystem]);

  const setTheme = (t: Theme) => setState({ theme: t, followsSystem: false });
  const toggleTheme = () => setTheme(theme === 'dark' ? 'light' : 'dark');

  return { theme, isDark: theme === 'dark', toggleTheme, setTheme };
}