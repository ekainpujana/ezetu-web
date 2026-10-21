import { useEffect, useRef, useState } from 'react';
import { Moon, Sun, Globe, ChevronDown, Camera, Bookmark, Menu, X, Mountain } from 'lucide-react';
import { useApp } from '@/lib/app-context';
import { LANGS } from '@/lib/i18n';
import type { LangCode, ViewTab } from '@/lib/types';
import { Ikurrina } from './Ikurrina';

export function Header() {
  const { theme, toggleTheme, lang, setLang, t, tab, setTab, setUploadOpen, wishlistOpen, setWishlistOpen } = useApp();
  const [langOpen, setLangOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const langRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (langRef.current && !langRef.current.contains(e.target as Node)) setLangOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const tabs: { id: ViewTab; icon: string; label: string }[] = [
    { id: 'gallery', icon: '🖼️', label: t('gallery') },
    { id: 'rankings', icon: '🏆', label: t('rankings') },
    { id: 'map', icon: '🗺️', label: t('mapExplorer') },
    { id: 'passport', icon: '🛂', label: t('myPassport') },
  ];

  const onTabClick = (id: ViewTab) => {
    setTab(id);
    setMobileOpen(false);
  };

  return (
    <header className="sticky top-0 z-[2000] bg-white/85 dark:bg-slate2-950/85 backdrop-blur-xl border-b border-forest-100/80 dark:border-slate2-800/80">
      <div className="max-w-[1600px] mx-auto px-3 sm:px-5 lg:px-7">
        <div className="flex items-center justify-between h-14 gap-2.5">
          {/* Logo */}
          <button onClick={() => setTab('gallery')} className="flex items-center gap-2 shrink-0 group">
            <span className="grid place-items-center w-8 h-8 rounded-lg bg-forest-600 text-white shadow-soft group-hover:scale-105 transition-transform">
              <Mountain className="w-4 h-4" strokeWidth={2.2} />
            </span>
            <span className="flex flex-col leading-none text-left">
              <span className="font-display text-lg font-600 tracking-tight text-forest-800 dark:text-sand-100">Ezetu</span>
              <span className="text-[9px] uppercase tracking-[0.16em] text-terracotta-500 dark:text-terracotta-300/80 font-500">{t('tagline')}</span>
            </span>
          </button>

          {/* Center tabs (desktop) */}
          <nav className="hidden md:flex items-center gap-1 p-0.5 rounded-xl bg-forest-50 dark:bg-slate2-900/60 border border-forest-100 dark:border-slate2-800">
            {tabs.map((tb) => (
              <button
                key={tb.id}
                onClick={() => onTabClick(tb.id)}
                className={`px-3 py-1.5 rounded-lg text-[13px] font-500 transition-all flex items-center gap-1.5 ${
                  tab === tb.id
                    ? 'bg-white dark:bg-slate2-800 text-forest-800 dark:text-sand-100 shadow-soft'
                    : 'text-forest-700/70 dark:text-sand-300/70 hover:text-forest-800 dark:hover:text-sand-100'
                }`}
              >
                <span className="text-sm">{tb.icon}</span>
                {tb.label}
              </button>
            ))}
          </nav>

          {/* Right cluster */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Language */}
            <div ref={langRef} className="relative">
              <button
                onClick={() => setLangOpen((v) => !v)}
                className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg border border-forest-100 dark:border-slate2-800 bg-white dark:bg-slate2-900 hover:border-forest-300 dark:hover:border-slate2-700 transition-colors"
                aria-label={t('language')}
              >
                <Globe className="w-3.5 h-3.5 text-forest-700 dark:text-sand-300" />
                {lang === 'EUS' ? <Ikurrina className="w-3.5 h-2" /> : null}
                <span className="text-xs font-600 text-forest-800 dark:text-sand-100">{lang}</span>
                <ChevronDown className={`w-3 h-3 text-forest-700/60 dark:text-sand-300/60 transition-transform ${langOpen ? 'rotate-180' : ''}`} />
              </button>
              {langOpen && (
                <div className="absolute right-0 mt-1.5 w-44 rounded-xl border border-forest-100 dark:border-slate2-800 bg-white dark:bg-slate2-900 shadow-lift overflow-hidden animate-popIn origin-top-right z-[2100]">
                  {LANGS.map((l) => (
                    <button
                      key={l.code}
                      onClick={() => { setLang(l.code as LangCode); setLangOpen(false); }}
                      className={`w-full flex items-center gap-3 px-3.5 py-2 text-sm transition-colors ${
                        lang === l.code
                          ? 'bg-forest-50 dark:bg-slate2-800 text-forest-800 dark:text-sand-100 font-600'
                          : 'text-forest-700/80 dark:text-sand-300/80 hover:bg-forest-50/60 dark:hover:bg-slate2-800/60'
                      }`}
                    >
                      <span className="text-base">{l.flag === 'IK' ? <Ikurrina className="w-5 h-3 inline-block align-middle" /> : l.flag}</span>
                      <span className="flex-1 text-left">{l.label}</span>
                      <span className="text-[10px] font-600 text-forest-500/60 dark:text-sand-400/60">{l.short}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Theme */}
            <button
              onClick={toggleTheme}
              className="grid place-items-center w-9 h-9 rounded-lg border border-forest-100 dark:border-slate2-800 bg-white dark:bg-slate2-900 hover:border-forest-300 dark:hover:border-slate2-700 transition-colors text-forest-700 dark:text-sand-200"
              aria-label={theme === 'dark' ? t('light') : t('dark')}
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* Add photo */}
            <button
              onClick={() => setUploadOpen(true)}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-terracotta-500 hover:bg-terracotta-600 text-white font-600 text-sm shadow-soft transition-colors"
            >
              <Camera className="w-3.5 h-3.5" />
              {t('addPhoto')}
            </button>

            {/* Wishlist */}
            <button
              onClick={() => setWishlistOpen(!wishlistOpen)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-600 text-sm transition-colors border ${
                wishlistOpen
                  ? 'bg-forest-600 border-forest-600 text-white'
                  : 'bg-white dark:bg-slate2-900 border-forest-100 dark:border-slate2-800 text-forest-800 dark:text-sand-100 hover:border-forest-300 dark:hover:border-slate2-700'
              }`}
            >
              <Bookmark className={`w-3.5 h-3.5 ${wishlistOpen ? 'fill-white' : ''}`} />
              <span className="hidden lg:inline">{t('saved')}</span>
            </button>

            {/* Mobile menu */}
            <button
              onClick={() => setMobileOpen((v) => !v)}
              className="md:hidden grid place-items-center w-9 h-9 rounded-lg border border-forest-100 dark:border-slate2-800 bg-white dark:bg-slate2-900 text-forest-800 dark:text-sand-100"
              aria-label="Menu"
            >
              {mobileOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Mobile tabs */}
        {mobileOpen && (
          <nav className="md:hidden flex flex-col gap-1 pb-3 pt-1.5 animate-riseIn">
            {tabs.map((tb) => (
              <button
                key={tb.id}
                onClick={() => onTabClick(tb.id)}
                className={`px-3.5 py-2.5 rounded-lg text-sm font-500 flex items-center gap-3 transition-colors ${
                  tab === tb.id ? 'bg-forest-600 text-white' : 'bg-forest-50 dark:bg-slate2-900 text-forest-800 dark:text-sand-100'
                }`}
              >
                <span className="text-base">{tb.icon}</span>
                {tb.label}
              </button>
            ))}
            <button
              onClick={() => { setUploadOpen(true); setMobileOpen(false); }}
              className="mt-1 px-3.5 py-2.5 rounded-lg bg-terracotta-500 text-white font-600 text-sm flex items-center gap-2"
            >
              <Camera className="w-4 h-4" />
              {t('addPhoto')}
            </button>
          </nav>
        )}
      </div>
    </header>
  );
}
