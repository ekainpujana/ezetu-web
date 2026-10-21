import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Star, ShieldAlert, BadgeCheck, Footprints, Bookmark, MapPin, Trophy, Navigation } from 'lucide-react';

// Fix Leaflet's default marker icons so they never crash when bundled
// (Vite drops the relative asset URLs Leaflet computes at runtime).
// We use custom divIcons for spot pins, but this protects any default marker.
delete (L.Icon.Default.prototype as unknown as { _getIconUrl: unknown })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});
import type { Spot } from '@/lib/types';
import { useApp } from '@/lib/app-context';
import { useSpots, useVisits, useWishlist } from '@/lib/data';
import { categoryColor, flagEmoji, basqueName, spotCountryLabel } from '@/lib/utils';
import { SpotDrawer } from './SpotDrawer';
import { Ikurrina } from './Ikurrina';

const MAX_LIST_SPOTS = 12;
const INITIAL_CENTER: [number, number] = [46.5, 6.5];
const INITIAL_ZOOM = 5;

function rankBadgeClass(rank: number): string {
  if (rank === 1) return 'bg-gradient-to-br from-amber-400 to-amber-600 text-white';
  if (rank === 2) return 'bg-gradient-to-br from-slate-300 to-slate-500 text-white';
  if (rank === 3) return 'bg-gradient-to-br from-orange-400 to-orange-600 text-white';
  return 'bg-forest-100 dark:bg-slate2-800 text-forest-700 dark:text-sand-300';
}

function isValidCoord(lat: unknown, lng: unknown): boolean {
  return typeof lat === 'number' && typeof lng === 'number'
    && !Number.isNaN(lat) && !Number.isNaN(lng)
    && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
}

export function MapView({ refreshKey }: { refreshKey?: number }) {
  const { t, lang, focusedSpotId, setFocusedSpotId } = useApp();
  const { spots, loading } = useSpots(refreshKey);
  const { visitedIds } = useVisits();
  const { savedIds } = useWishlist();

  const [selected, setSelected] = useState<Spot | null>(null);
  const [hovered, setHovered] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'city' | 'village' | 'nature'>('all');
  const [boundsVersion, setBoundsVersion] = useState(0);

  const mapRef = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const markersRef = useRef<Map<string, L.Marker>>(new Map());
  const cardRefs = useRef<Map<string, HTMLDivElement | null>>(new Map());
  const boundsVersionRef = useRef(0);

  // Init Leaflet map — free OSM tiles, Western Europe center
  useEffect(() => {
    if (!mapRef.current || map.current) return;
    const m = L.map(mapRef.current, {
      center: INITIAL_CENTER,
      zoom: INITIAL_ZOOM,
      minZoom: 2,
      worldCopyJump: true,
      scrollWheelZoom: true,
      zoomControl: false,
    });
    L.control.zoom({ position: 'bottomright' }).addTo(m);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(m);
    map.current = m;

    // Invalidate size so tiles fit the right container perfectly after layout settles
    requestAnimationFrame(() => {
      m.invalidateSize();
      boundsVersionRef.current++;
      setBoundsVersion(boundsVersionRef.current);
    });
    const resizeTimer = setTimeout(() => m.invalidateSize(), 250);

    const onMove = () => {
      boundsVersionRef.current++;
      setBoundsVersion(boundsVersionRef.current);
    };
    m.on('moveend', onMove);
    m.on('zoomend', onMove);

    return () => {
      clearTimeout(resizeTimer);
      m.remove();
      map.current = null;
    };
  }, []);

  // All valid spots (fallback for empty bounds)
  const validSpots = useMemo(
    () => spots.filter((s) => isValidCoord(s.latitude, s.longitude)),
    [spots],
  );

  // Bounds-based filtering + ranking — falls back to all spots when bounds empty
  const visibleRankedSpots = useMemo(() => {
    if (loading) return [];
    const byCat = (s: Spot) => categoryFilter === 'all' || s.category === categoryFilter;
    if (!map.current) return validSpots.filter(byCat).slice();
    const b = map.current.getBounds();
    const inBounds = validSpots.filter((s) => byCat(s) && b.contains(L.latLng(s.latitude, s.longitude)));
    const ranked = (inBounds.length > 0 ? inBounds : validSpots.filter(byCat)).slice();
    ranked.sort((a, b) => b.bayesian_rating - a.bayesian_rating);
    return ranked;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [validSpots, categoryFilter, loading, boundsVersion]);

  const topSpots = useMemo(() => visibleRankedSpots.slice(0, MAX_LIST_SPOTS), [visibleRankedSpots]);
  const totalVisible = visibleRankedSpots.length;

  // Render a marker for EVERY valid spot in the dataset
  useEffect(() => {
    const m = map.current;
    if (!m) return;
    const visibleIds = new Set(visibleRankedSpots.map((s) => s.id));
    // remove stale markers not in current filtered view
    markersRef.current.forEach((mk, id) => {
      if (!visibleIds.has(id)) { m.removeLayer(mk); markersRef.current.delete(id); }
    });
    visibleRankedSpots.forEach((s) => {
      const existing = markersRef.current.get(s.id);
      const isActive = hovered === s.id || focusedSpotId === s.id;
      const isVisited = visitedIds.has(s.id);
      const isEusSpot = lang === 'EUS' && s.euskal_herria;
      const size = isActive ? 38 : 28;
      const pinContent = isEusSpot
        ? `<svg viewBox="0 0 28 14" width="${size - 10}" height="${(size - 10) / 2}" style="display:block;border-radius:2px;overflow:hidden" shape-rendering="geometricPrecision"><rect width="28" height="14" fill="#D52B1E"/><path d="M0,0 L4.31,0 L28,9.69 L28,14 L23.69,14 L0,4.31 Z" fill="#009B48"/><path d="M23.69,0 L28,0 L28,4.31 L4.31,14 L0,14 L0,9.69 Z" fill="#009B48"/><rect x="11.33" width="5.33" height="14" fill="#FFFFFF"/><rect y="4.33" width="28" height="5.33" fill="#FFFFFF"/></svg>`
        : (flagEmoji(s.country_code).slice(0, 2) || '·');
      const icon = L.divIcon({
        className: '',
        html: `<div class="ezetu-pin ${s.category} ${isActive ? 'active' : ''} ${isVisited ? 'visited' : ''}" style="width:${size}px;height:${size}px">${pinContent}</div>`,
        iconSize: [size, size],
        iconAnchor: [size / 2, size / 2],
      });
      if (existing) {
        existing.setIcon(icon);
      } else {
        const mk = L.marker([s.latitude, s.longitude], { icon }).addTo(m);
        const label = isEusSpot ? basqueName(s.id, s.name) : s.name;
        mk.bindPopup(`<div style="font-weight:600;font-size:13px">${label}<br/><span style="font-weight:400;font-size:11px;opacity:.7">${spotCountryLabel(s, lang)}</span></div>`);
        mk.on('click', () => { setSelected(s); setFocusedSpotId(s.id); });
        mk.on('mouseover', () => setHovered(s.id));
        mk.on('mouseout', () => setHovered((h) => (h === s.id ? null : h)));
        markersRef.current.set(s.id, mk);
      }
    });
  }, [visibleRankedSpots, hovered, focusedSpotId, visitedIds, setFocusedSpotId, lang]);

  // Pan to focused spot when triggered externally (e.g. from wishlist or gallery)
  useEffect(() => {
    if (!focusedSpotId || !map.current) return;
    const s = spots.find((x) => x.id === focusedSpotId);
    if (!s) return;
    const currentZoom = map.current.getZoom();
    map.current.flyTo([s.latitude, s.longitude], Math.max(currentZoom, 8), { duration: 0.8 });
    setSelected(s);
    const timer = setTimeout(() => {
      const el = cardRefs.current.get(focusedSpotId);
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 300);
    return () => clearTimeout(timer);
  }, [focusedSpotId, spots, setFocusedSpotId]);

  // Scroll card into view on map-hover
  useEffect(() => {
    if (!hovered) return;
    const el = cardRefs.current.get(hovered);
    el?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [hovered]);

  const onCardHover = useCallback((id: string | null) => setHovered(id), []);
  const onCardClick = useCallback((s: Spot) => {
    setSelected(s);
    setFocusedSpotId(s.id);
    if (map.current) {
      map.current.flyTo([s.latitude, s.longitude], Math.max(map.current.getZoom(), 8), { duration: 0.6 });
    }
  }, [setFocusedSpotId]);
  const backToList = useCallback(() => { setSelected(null); setFocusedSpotId(null); }, [setFocusedSpotId]);

  return (
    <div className="flex flex-row w-full h-[calc(100vh-3.5rem)] overflow-hidden">
      {/* Left sidebar: ranked list OR spot detail — always side-by-side */}
      <div className="w-[320px] sm:w-[360px] md:w-[400px] h-full flex-shrink-0 overflow-y-auto border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 z-10">
        {selected ? (
          <SpotDrawer
            spot={selected}
            inline
            onClose={backToList}
            onVisitedChange={() => {}}
            onWishlistChange={() => {}}
          />
        ) : (
          <>
            {/* Sticky header with dynamic counter + filters */}
            <div className="sticky top-0 z-10 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shrink-0 shadow-soft">
              <div className="px-4 pt-3 pb-3">
                <h2 className="font-display text-lg font-700 text-forest-800 dark:text-sand-100 flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-terracotta-500" />
                  {t('zoneRanking')}
                </h2>
                <p className="text-xs text-forest-700/70 dark:text-sand-300/70 mt-1 flex items-center gap-1.5">
                  <MapPin className="w-3 h-3 text-forest-500" />
                  {totalVisible > 0 ? (
                    <>{totalVisible} <span className="lowercase">{t('spotsFound')}</span> · {t('ranking').toLowerCase()}</>
                  ) : (
                    <span className="text-forest-700/50 dark:text-sand-300/50">{t('panHint')}</span>
                  )}
                </p>
                <div className="flex gap-1.5 mt-2.5">
                  {(['all', 'city', 'village', 'nature'] as const).map((c) => (
                    <button
                      key={c}
                      onClick={() => setCategoryFilter(c)}
                      className={`px-2.5 py-1 rounded-full text-[11px] font-600 transition-colors ${
                        categoryFilter === c ? 'bg-forest-600 text-white' : 'bg-forest-50 dark:bg-slate2-900 border border-forest-100 dark:border-slate2-800 text-forest-700/70 dark:text-sand-300/70'
                      }`}
                    >
                      {c === 'all' ? `🌍 ${t('all')}` : c === 'city' ? `🏙️ ${t('cities')}` : c === 'village' ? `🏘️ ${t('villages')}` : `🌲 ${t('nature')}`}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Scrollable ranked list */}
            <div className="p-3 space-y-2.5">
              {loading && Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-24 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 shimmer-bg animate-shimmer" />
              ))}

              {!loading && totalVisible === 0 && (
                <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
                  <Navigation className="w-10 h-10 text-forest-300 dark:text-slate2-700 mb-3" />
                  <p className="text-sm text-forest-700/60 dark:text-sand-300/60">{t('noSpotsVisible')}</p>
                </div>
              )}

              {!loading && topSpots.map((s, idx) => {
                const cc = categoryColor(s.category);
                const isEus = lang === 'EUS' && s.euskal_herria;
                const isActive = hovered === s.id || focusedSpotId === s.id;
                const isVisited = visitedIds.has(s.id);
                const isSaved = savedIds.has(s.id);
                const rank = idx + 1;
                return (
                  <div
                    key={s.id}
                    ref={(el) => { cardRefs.current.set(s.id, el); }}
                    onMouseEnter={() => onCardHover(s.id)}
                    onMouseLeave={() => onCardHover(null)}
                    onClick={() => onCardClick(s)}
                    className={`group relative flex gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-850 border cursor-pointer transition-all ${
                      isActive ? 'border-forest-500 dark:border-forest-400 shadow-lift scale-[1.01]' : 'border-slate-200 dark:border-slate-800 hover:border-forest-300 dark:hover:border-slate2-700'
                    }`}
                  >
                    <div className={`absolute -top-2 -left-2 z-10 grid place-items-center w-7 h-7 rounded-full text-[11px] font-700 shadow-soft ring-2 ring-white dark:ring-slate-900 ${rankBadgeClass(rank)}`}>
                      {rank === 1 ? '★' : `#${rank}`}
                    </div>

                    <div className="w-20 h-20 shrink-0 rounded-xl overflow-hidden bg-slate-200 dark:bg-slate-800">
                      {s.cover_photo && <img src={s.cover_photo.image_url} alt={s.name} loading="lazy" className="w-full h-full object-cover" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-600 ${cc.bg} ${cc.text} ring-1 ${cc.ring}`}>
                          {s.category === 'city' ? '🏙️' : s.category === 'village' ? '🏘️' : '🌲'}
                        </span>
                        {s.verified && <BadgeCheck className="w-3.5 h-3.5 text-forest-500 dark:text-forest-300" />}
                        {isEus && <Ikurrina className="w-3.5 h-2" />}
                        {s.protected_zone && <ShieldAlert className="w-3.5 h-3.5 text-amber-500" />}
                      </div>
                      <h3 className="font-600 text-sm text-forest-800 dark:text-sand-100 truncate mt-1">{isEus ? basqueName(s.id, s.name) : s.name}</h3>
                      <p className="text-xs text-forest-700/60 dark:text-sand-300/60 truncate flex items-center gap-1">
                        {isEus ? <Ikurrina className="w-3 h-1.5" /> : <span>{flagEmoji(s.country_code)}</span>}
                        {' '}{spotCountryLabel(s, lang)}
                      </p>
                      <div className="flex items-center gap-2 mt-1.5 text-[11px]">
                        <span className="flex items-center gap-0.5 text-terracotta-600 dark:text-terracotta-300 font-700">
                          <Star className="w-3.5 h-3.5 fill-terracotta-500 text-terracotta-500" />
                          {s.bayesian_rating.toFixed(1)}
                        </span>
                        <span className="text-forest-700/40 dark:text-sand-300/40">· {s.ratings_count} {t('bayesian').toLowerCase()}</span>
                        {isVisited && <span className="flex items-center gap-0.5 text-forest-600 dark:text-forest-300 font-600"><Footprints className="w-3 h-3" /></span>}
                        {isSaved && <span className="text-terracotta-500"><Bookmark className="w-3 h-3 fill-terracotta-500" /></span>}
                      </div>
                    </div>
                  </div>
                );
              })}

              {!loading && totalVisible > MAX_LIST_SPOTS && (
                <p className="text-center text-[11px] text-forest-700/40 dark:text-sand-300/40 py-2">
                  +{totalVisible - MAX_LIST_SPOTS} {t('spotsFound')} · {t('panHint').toLowerCase()}
                </p>
              )}
            </div>
          </>
        )}
      </div>

      {/* Right map — takes the remaining space, always visible next to the list */}
      <div className="flex-1 h-full relative" style={{ minWidth: '300px' }}>
        <div ref={mapRef} className="absolute inset-0" style={{ height: '100%', width: '100%', minHeight: '100%' }} />
        {/* Legend */}
        <div className="absolute bottom-4 left-4 z-[500] p-3 rounded-2xl bg-white/90 dark:bg-slate-900/90 backdrop-blur border border-slate-200 dark:border-slate-800 shadow-soft text-xs space-y-1.5">
          <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-[#2e5a41]" /> {t('cities')}</div>
          <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-[#c6643f]" /> {t('villages')}</div>
          <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-[#3f7253]" /> {t('nature')}</div>
        </div>
      </div>
    </div>
  );
}
