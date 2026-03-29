import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useState,
} from 'react';

const ThemeContext = createContext(null);

const STORAGE_KEY = 'kanban-theme';

function getStoredThemePreference() {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    if (v === 'dark' || v === 'light' || v === 'system') return v;
  } catch {
    /* ignore */
  }
  return 'system';
}

function setStoredThemePreference(mode) {
  try {
    if (mode === 'system') localStorage.removeItem(STORAGE_KEY);
    else localStorage.setItem(STORAGE_KEY, mode);
  } catch {
    /* ignore */
  }
}

function applyDomTheme(mode) {
  const mq = window.matchMedia('(prefers-color-scheme: dark)');
  const dark = mode === 'dark' || (mode === 'system' && mq.matches);
  if (dark) document.documentElement.classList.add('dark');
  else document.documentElement.classList.remove('dark');
}

export function ThemeProvider({ children }) {
  const [themeMode, setThemeModeState] = useState(() => getStoredThemePreference());

  const setThemeMode = useCallback((next) => {
    setStoredThemePreference(next);
    setThemeModeState(next);
  }, []);

  useLayoutEffect(() => {
    applyDomTheme(themeMode);
  }, [themeMode]);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => {
      if (getStoredThemePreference() === 'system') applyDomTheme('system');
    };
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  const value = { themeMode, setThemeMode };
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
