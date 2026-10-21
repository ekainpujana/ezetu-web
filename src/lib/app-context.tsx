import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { LangCode, ViewTab } from './types';
import { makeT } from './i18n';

type Theme = 'light' | 'dark';

interface AppCtx {
  theme: Theme;
  toggleTheme: () => void;
  lang: LangCode;
  setLang: (l: LangCode) => void;
  t: (k: string) => string;
  tab: ViewTab;
  setTab: (v: ViewTab) => void;
  uploadOpen: boolean;
  setUploadOpen: (v: boolean) => void;
  addPlaceOpen: boolean;
  setAddPlaceOpen: (v: boolean) => void;
  prefilledComarca: string | null;
  setPrefilledComarca: (v: string | null) => void;
  wishlistOpen: boolean;
  setWishlistOpen: (v: boolean) => void;
  focusedSpotId: string | null;
  setFocusedSpotId: (id: string | null) => void;
  spotsRefreshKey: number;
  bumpSpotsRefresh: () => void;
}

const Ctx = createContext<AppCtx | null>(null);

const LANG_KEY = 'ezetu.lang';
const THEME_KEY = 'ezetu.theme';

export function AppProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => {
    const saved = localStorage.getItem(THEME_KEY) as Theme | null;
    if (saved) return saved;
    return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });
  const [lang, setLangState] = useState<LangCode>(() => (localStorage.getItem(LANG_KEY) as LangCode) ?? 'ES');
  const [tab, setTab] = useState<ViewTab>('gallery');
  const [uploadOpen, setUploadOpen] = useState(false);
  const [addPlaceOpen, setAddPlaceOpen] = useState(false);
  const [prefilledComarca, setPrefilledComarca] = useState<string | null>(null);
  const [wishlistOpen, setWishlistOpen] = useState(false);
  const [focusedSpotId, setFocusedSpotId] = useState<string | null>(null);
  const [spotsRefreshKey, setSpotsRefreshKey] = useState(0);
  const bumpSpotsRefresh = useCallback(() => setSpotsRefreshKey((k) => k + 1), []);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') root.classList.add('dark');
    else root.classList.remove('dark');
    localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

  const setLang = useCallback((l: LangCode) => {
    setLangState(l);
    localStorage.setItem(LANG_KEY, l);
    document.documentElement.lang = l.toLowerCase();
  }, []);

  useEffect(() => { document.documentElement.lang = lang.toLowerCase(); }, [lang]);

  const t = useMemo(() => makeT(lang), [lang]);
  const toggleTheme = useCallback(() => setTheme((p) => (p === 'dark' ? 'light' : 'dark')), []);

  const value: AppCtx = {
    theme, toggleTheme, lang, setLang, t,
    tab, setTab, uploadOpen, setUploadOpen, addPlaceOpen, setAddPlaceOpen, prefilledComarca, setPrefilledComarca, wishlistOpen, setWishlistOpen,
    focusedSpotId, setFocusedSpotId, spotsRefreshKey, bumpSpotsRefresh,
  };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useApp(): AppCtx {
  const c = useContext(Ctx);
  if (!c) throw new Error('useApp must be used within AppProvider');
  return c;
}
