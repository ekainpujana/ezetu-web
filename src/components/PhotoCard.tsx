import { useState } from 'react';
import { Heart, MapPin, BadgeCheck } from 'lucide-react';
import type { Photo, Spot } from '@/lib/types';
import { useApp } from '@/lib/app-context';
import { seasonIcon } from '@/lib/i18n';
import { formatLikes, basqueName, spotCountryLabel } from '@/lib/utils';
import { isPhotoLiked, togglePhotoLike } from '@/lib/data';
import { Ikurrina } from './Ikurrina';

export function PhotoCard({ photo, spot, onSpotClick }: {
  photo: Photo; spot?: Spot; onSpotClick?: (id: string) => void;
}) {
  const { t, lang, setTab } = useApp();
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(photo.likes);
  const [checked, setChecked] = useState(false);
  const [heart, setHeart] = useState(false);

  // lazy-load liked state per card
  if (!checked) {
    isPhotoLiked(photo.id).then((v) => { setLiked(v); setChecked(true); }).catch(() => setChecked(true));
  }

  const aspect = photo.width / photo.height;
  const isEus = lang === 'EUS' && spot?.euskal_herria;

  const onLike = async () => {
    const next = !liked;
    setLiked(next);
    setLikeCount((c) => Math.max(0, c + (next ? 1 : -1)));
    setHeart(true);
    setTimeout(() => setHeart(false), 450);
    try { await togglePhotoLike(photo.id, !next); }
    catch { setLiked(!next); setLikeCount(photo.likes); }
  };

  const goToMap = () => {
    if (!spot) return;
    if (onSpotClick) onSpotClick(spot.id);
    else { setTab('map'); }
  };

  return (
    <figure className="group relative overflow-hidden rounded-2xl bg-forest-50 dark:bg-slate2-850 shadow-soft hover:shadow-lift transition-shadow cursor-pointer animate-riseIn">
      <div className="relative overflow-hidden" style={{ aspectRatio: aspect }}>
        <img
          src={photo.image_url}
          alt={spot?.name ?? 'Landscape'}
          loading="lazy"
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/0 to-black/0 opacity-90" />
      </div>

      {/* Top tags */}
      <div className="absolute top-3 left-3 flex items-center gap-1.5">
        <span className="px-2 py-0.5 rounded-full bg-white/85 dark:bg-slate2-900/85 backdrop-blur text-[11px] font-600 text-forest-800 dark:text-sand-100">
          {seasonIcon[photo.season]} {t(photo.season)}
        </span>
        {isEus && (
          <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-white/85 dark:bg-slate2-900/85 backdrop-blur">
            <Ikurrina className="w-4 h-2.5" />
          </span>
        )}
      </div>

      {/* Like button */}
      <button
        onClick={onLike}
        aria-label={t('likes')}
        className="absolute top-3 right-3 grid place-items-center w-9 h-9 rounded-full bg-white/85 dark:bg-slate2-900/85 backdrop-blur hover:scale-110 active:scale-95 transition-transform"
      >
        <Heart
          className={`w-4.5 h-4.5 ${liked ? 'text-terracotta-500 fill-terracotta-500' : 'text-forest-800 dark:text-sand-100'} ${heart ? 'animate-heartbeat' : ''}`}
        />
      </button>

      {/* Bottom info */}
      <figcaption className="absolute bottom-0 inset-x-0 p-3.5 text-white">
        {spot && (
          <button onClick={goToMap} className="block text-left w-full">
            <div className="flex items-center gap-1.5 text-sm font-600">
              <MapPin className="w-3.5 h-3.5 text-terracotta-300" />
              {isEus ? basqueName(spot.id, spot.name) : spot.name}
              {spot.verified && <BadgeCheck className="w-3.5 h-3.5 text-sand-300" />}
              {isEus && <Ikurrina className="w-3.5 h-2.5 ml-0.5" />}
            </div>
            <div className="text-[11px] text-white/70 mt-0.5">{spotCountryLabel(spot, lang)}</div>
          </button>
        )}
        <div className="flex items-center justify-between mt-2">
          <span className="text-[11px] text-white/70">@{photo.author}</span>
          <span className="flex items-center gap-1 text-[11px] font-600">
            <Heart className="w-3 h-3 fill-terracotta-400 text-terracotta-400" />
            {formatLikes(likeCount)}
          </span>
        </div>
      </figcaption>
    </figure>
  );
}
