import { useMemo, useState } from 'react';
import { ComposableMap, Geographies, Geography, Marker } from 'react-simple-maps';
import { geoPath, geoOrthographic } from 'd3-geo';
import type { Spot, Visit } from '@/lib/types';
import { useApp } from '@/lib/app-context';
import { useSpots, useVisits, computeStats, continentOf, CONTINENTS_TOTAL, COUNTRIES_TOTAL } from '@/lib/data';
import { flagEmoji, categoryColor, basqueName, spotCountryLabel } from '@/lib/utils';
import { Ikurrina } from './Ikurrina';
import { Globe2, Mountain, Home, Waves, Share2, Footprints, Sparkles, X, MapPin } from 'lucide-react';

const WORLD_GEO_URL = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json';

export function PassportView({ refreshKey }: { refreshKey?: number }) {
  const { t, lang, setTab, setFocusedSpotId } = useApp();
  const { spots } = useSpots(refreshKey);
  const { visitedIds, loading } = useVisits();
  const [storyOpen, setStoryOpen] = useState(false);
  const [rotation, setRotation] = useState({ x: -10, y: 0 });

  const spotsById = useMemo(() => new Map(spots.map((s) => [s.id, s])), [spots]);
  const stats = useMemo(() => computeStats(
    Array.from(visitedIds).map((id): Visit => ({ id, spot_id: id, device_id: '', created_at: '' })),
    spotsById
  ), [visitedIds, spotsById]);

  const visitedSpots = useMemo(() => spots.filter((s) => visitedIds.has(s.id)), [spots, visitedIds]);
  const visitedCountries = useMemo(() => {
    const set = new Set<string>();
    visitedSpots.forEach((s) => set.add(s.country_code));
    return set;
  }, [visitedSpots]);

  const continentsVisited = useMemo(() => {
    const set = new Set<string>();
    visitedSpots.forEach((s) => { const c = continentOf(s.country_code); if (c) set.add(c); });
    return set;
  }, [visitedSpots]);

  // Summits: nature spots with elevation > 1500m
  const summitsVisited = visitedSpots.filter((s) => s.category === 'nature' && (s.elevation_m ?? 0) > 1500).length;
  const summitsTotal = spots.filter((s) => s.category === 'nature' && (s.elevation_m ?? 0) > 1500).length;
  // Coves: coastal nature spots (protected_zone or low elevation nature) — approximation
  const covesVisited = visitedSpots.filter((s) => s.category === 'nature' && (s.elevation_m ?? 0) < 500).length;
  const covesTotal = spots.filter((s) => s.category === 'nature' && (s.elevation_m ?? 0) < 500).length;
  const villagesVisited = stats.villages;
  const villagesTotal = spots.filter((s) => s.category === 'village').length;

  const worldPct = ((visitedCountries.size / COUNTRIES_TOTAL) * 100).toFixed(1);

  const badges = [
    { id: 'trotamundos', icon: Globe2, label: t('trotamundos'), sub: `${continentsVisited.size}/${CONTINENTS_TOTAL} ${t('continents')}`, value: continentsVisited.size, max: CONTINENTS_TOTAL, color: 'from-forest-500 to-forest-700' },
    { id: 'cabra', icon: Mountain, label: t('cabraMontes'), sub: `${summitsVisited}/${summitsTotal || 1} ${t('summits')}`, value: summitsVisited, max: summitsTotal || 1, color: 'from-slate-400 to-slate2-700' },
    { id: 'alma', icon: Home, label: t('almaRural'), sub: `${villagesVisited}/${villagesTotal || 1} ${t('villagesLower')}`, value: villagesVisited, max: villagesTotal || 1, color: 'from-terracotta-400 to-terracotta-600' },
    { id: 'calas', icon: Waves, label: t('cazadorCalas'), sub: `${covesVisited}/${covesTotal || 1} ${t('coves')}`, value: covesVisited, max: covesTotal || 1, color: 'from-sky-400 to-blue-600' },
  ];

  const projection = useMemo(() => geoOrthographic().rotate([rotation.y, rotation.x]).scale(220).clipAngle(90), [rotation]);

  const handleDrag = (e: React.MouseEvent) => {
    if (e.buttons !== 1) return;
    setRotation((r) => ({ x: r.x, y: r.y + e.movementX * 0.4 }));
  };

  return (
    <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 pb-16">
      <div className="mt-6 mb-8">
        <h1 className="font-display text-3xl sm:text-4xl font-700 text-forest-800 dark:text-sand-100">{t('myPassport')}</h1>
        <p className="text-forest-700/60 dark:text-sand-300/60 text-sm mt-1">{t('passportSubtitle')}</p>
      </div>

      {loading ? (
        <div className="grid place-items-center h-96">
          <div className="w-10 h-10 rounded-full border-2 border-forest-300 border-t-forest-600 animate-spin" />
        </div>
      ) : visitedIds.size === 0 ? (
        <div className="grid place-items-center h-96 text-center px-6">
          <div>
            <Footprints className="w-12 h-12 text-forest-400 mx-auto mb-3" />
            <p className="text-forest-700/70 dark:text-sand-300/70 max-w-md">{t('noVisits')}</p>
            <button onClick={() => setTab('map')} className="mt-4 px-5 py-2.5 rounded-xl bg-forest-600 text-white font-600 text-sm hover:bg-forest-700 transition-colors">
              {t('mapExplorer')}
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Scratch globe + stats */}
          <div className="grid lg:grid-cols-2 gap-6 mb-8">
            <div className="relative rounded-3xl bg-gradient-to-b from-forest-800 to-forest-950 p-6 overflow-hidden shadow-lift">
              <div className="absolute top-4 right-4 text-[11px] text-sand-300/60 font-mono">drag ↔</div>
              <div onMouseMove={handleDrag} className="grid place-items-center h-80 cursor-grab active:cursor-grabbing select-none">
                <ComposableMap projection={projection} width={400} height={320}>
                  <Geographies geography={WORLD_GEO_URL}>
                    {({ geographies }) =>
                      geographies.map((geo) => {
                        const gid = String(geo.id ?? '');
                        const visited = visitedCountries.has(gid) || visitedCountries.has(gid.toLowerCase()) || visitedCountries.has(String(geo.properties?.iso_a2 ?? ''));
                        return (
                          <Geography
                            key={geo.rsmKey}
                            geography={geo}
                            fill={visited ? '#c6643f' : '#1e3929'}
                            stroke="#0d1a13"
                            strokeWidth={0.4}
                          />
                        );
                      })
                    }
                  </Geographies>
                  {visitedSpots.map((s) => {
                    const proj = projection([s.longitude, s.latitude]);
                    if (!proj) return null;
                    return <Marker key={s.id} coordinates={[s.longitude, s.latitude]}>
                      <circle r={3} fill="#f6e5db" stroke="#c6643f" strokeWidth={1} />
                    </Marker>;
                  })}
                </ComposableMap>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 p-5 rounded-2xl bg-white dark:bg-slate2-850 border border-forest-100 dark:border-slate2-800 shadow-soft">
                <div className="text-[11px] uppercase tracking-wider text-forest-700/60 dark:text-sand-300/60">{t('worldExplored')}</div>
                <div className="flex items-end gap-2 mt-1">
                  <span className="font-display text-5xl font-700 text-forest-700 dark:text-forest-300">{worldPct}%</span>
                  <span className="text-sm text-forest-700/60 dark:text-sand-300/60 mb-1.5">{visitedCountries.size}/{COUNTRIES_TOTAL} {t('countries')}</span>
                </div>
                <div className="mt-3 h-2.5 rounded-full bg-forest-100 dark:bg-slate2-800 overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-forest-500 to-terracotta-500 transition-all duration-700" style={{ width: `${worldPct}%` }} />
                </div>
              </div>
              <StatCard label={t('citiesVisited')} value={stats.cities} icon="🏙️" />
              <StatCard label={t('villagesVisited')} value={stats.villages} icon="🏘️" />
              <StatCard label={t('natureVisited')} value={stats.nature} icon="🌲" />
              <StatCard label={t('continents')} value={continentsVisited.size} max={CONTINENTS_TOTAL} icon="🌍" />
            </div>
          </div>

          {/* Badges */}
          <section className="mb-8">
            <h2 className="font-display text-2xl font-700 text-forest-800 dark:text-sand-100 mb-4">{t('level')}</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {badges.map((b) => {
                const Icon = b.icon;
                const pct = Math.min(100, (b.value / b.max) * 100);
                const earned = b.value >= b.max && b.max > 0;
                return (
                  <div key={b.id} className={`p-5 rounded-2xl border shadow-soft transition-all ${earned ? 'bg-gradient-to-br from-forest-50 to-terracotta-50 dark:from-slate2-850 dark:to-slate2-900 border-terracotta-300 dark:border-terracotta-700' : 'bg-white dark:bg-slate2-850 border-forest-100 dark:border-slate2-800'}`}>
                    <div className={`w-12 h-12 rounded-2xl grid place-items-center bg-gradient-to-br ${b.color} text-white shadow-soft`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <h3 className="font-600 text-forest-800 dark:text-sand-100 mt-3">{b.label}</h3>
                    <p className="text-xs text-forest-700/60 dark:text-sand-300/60 mt-0.5">{b.sub}</p>
                    <div className="mt-3 h-2 rounded-full bg-forest-100 dark:bg-slate2-800 overflow-hidden">
                      <div className={`h-full bg-gradient-to-r ${b.color} transition-all duration-700`} style={{ width: `${pct}%` }} />
                    </div>
                    <p className="text-[11px] text-forest-700/50 dark:text-sand-300/50 mt-1.5 text-right">{t('progress')}: {pct.toFixed(0)}%</p>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Visited list */}
          <section className="mb-8">
            <h2 className="font-display text-2xl font-700 text-forest-800 dark:text-sand-100 mb-4">{t('visited')} ({visitedSpots.length})</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {visitedSpots.map((s) => {
                const isEus = lang === 'EUS' && s.euskal_herria;
                return (
                  <button
                    key={s.id}
                    onClick={() => { setFocusedSpotId(s.id); setTab('map'); }}
                    className="flex gap-3 p-3 rounded-2xl bg-white dark:bg-slate2-850 border border-forest-100 dark:border-slate2-800 hover:border-forest-300 dark:hover:border-slate2-700 transition-colors text-left"
                  >
                    <div className="w-16 h-16 shrink-0 rounded-xl overflow-hidden bg-forest-100 dark:bg-slate2-800">
                      {s.cover_photo && <img src={s.cover_photo.image_url} alt={s.name} loading="lazy" className="w-full h-full object-cover" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-600 text-sm text-forest-800 dark:text-sand-100 truncate">{isEus ? basqueName(s.id, s.name) : s.name}</h3>
                      <p className="text-xs text-forest-700/60 dark:text-sand-300/60 truncate flex items-center gap-1">
                        {isEus ? <Ikurrina className="w-3 h-1.5" /> : <span>{flagEmoji(s.country_code)}</span>} {spotCountryLabel(s, lang)}
                      </p>
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-forest-100 dark:bg-slate2-800 text-forest-700 dark:text-sand-300 font-600 mt-1 inline-block">
                        {s.category === 'city' ? '🏙️' : s.category === 'village' ? '🏘️' : '🌲'}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>

          {/* Story generator */}
          <div className="text-center">
            <button
              onClick={() => setStoryOpen(true)}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-terracotta-500 to-terracotta-600 text-white font-600 shadow-soft hover:shadow-lift transition-shadow"
            >
              <Share2 className="w-5 h-5" />
              {t('generateStory')}
            </button>
          </div>

          {storyOpen && <StoryCard stats={stats} worldPct={worldPct} visitedCountries={visitedCountries.size} onClose={() => setStoryOpen(false)} />}
        </>
      )}
    </div>
  );
}

function StatCard({ label, value, max, icon }: { label: string; value: number; max?: number; icon: string }) {
  return (
    <div className="p-4 rounded-2xl bg-white dark:bg-slate2-850 border border-forest-100 dark:border-slate2-800 shadow-soft">
      <div className="text-2xl">{icon}</div>
      <div className="font-display text-3xl font-700 text-forest-800 dark:text-sand-100 mt-1">{value}{max ? `/${max}` : ''}</div>
      <div className="text-[11px] text-forest-700/60 dark:text-sand-300/60 mt-0.5">{label}</div>
    </div>
  );
}

function StoryCard({ stats, worldPct, visitedCountries, onClose }: {
  stats: { cities: number; villages: number; nature: number };
  worldPct: string;
  visitedCountries: number;
  onClose: () => void;
}) {
  const { t } = useApp();
  return (
    <div className="fixed inset-0 z-50 grid place-items-center p-4 animate-fadeIn">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md aspect-[9/16] sm:aspect-[4/5] rounded-3xl overflow-hidden bg-gradient-to-b from-forest-800 via-forest-900 to-slate2-950 shadow-lift animate-popIn">
        <div className="absolute top-3 right-3 z-10">
          <button onClick={onClose} className="grid place-items-center w-8 h-8 rounded-full bg-white/15 text-white backdrop-blur hover:bg-white/25"><X className="w-4 h-4" /></button>
        </div>
        <div className="relative h-full p-6 flex flex-col text-white">
          <div className="flex items-center gap-2">
            <span className="grid place-items-center w-8 h-8 rounded-lg bg-terracotta-500"><Sparkles className="w-4 h-4" /></span>
            <span className="font-display text-lg font-700">Ezetu</span>
          </div>
          <div className="mt-auto space-y-5">
            <div>
              <p className="text-sand-300/70 text-xs uppercase tracking-wider">{t('myPassport')}</p>
              <h2 className="font-display text-4xl font-700 leading-tight">{worldPct}%<span className="text-2xl text-terracotta-300"> {t('worldExplored')}</span></h2>
              <p className="text-white/70 text-sm mt-1">{visitedCountries}/195 {t('countries')}</p>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {([['🏙️', stats.cities, t('citiesVisited')], ['🏘️', stats.villages, t('villagesVisited')], ['🌲', stats.nature, t('natureVisited')]] as const).map(([ic, v, l]) => (
                <div key={l} className="p-3 rounded-2xl bg-white/10 backdrop-blur text-center">
                  <div className="text-xl">{ic}</div>
                  <div className="font-display text-2xl font-700 mt-0.5">{v}</div>
                  <div className="text-[9px] text-white/60 uppercase tracking-wider mt-0.5">{l}</div>
                </div>
              ))}
            </div>
            <p className="text-center text-xs text-sand-300/60">{t('storyTip')}</p>
          </div>
        </div>
        {/* decorative pins */}
        <div className="absolute top-1/4 right-6 w-2 h-2 rounded-full bg-terracotta-400 animate-pulse" />
        <div className="absolute top-1/3 left-8 w-2 h-2 rounded-full bg-forest-300 animate-pulse" style={{ animationDelay: '0.5s' }} />
        <div className="absolute top-1/2 right-10 w-2 h-2 rounded-full bg-sand-300 animate-pulse" style={{ animationDelay: '1s' }} />
      </div>
    </div>
  );
}
