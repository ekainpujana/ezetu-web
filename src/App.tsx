import { AppProvider, useApp } from '@/lib/app-context';
import { Header } from '@/components/Header';
import { GalleryView } from '@/components/GalleryView';
import { RankingsView } from '@/components/RankingsView';
import { MapView } from '@/components/MapView';
import { PassportView } from '@/components/PassportView';
import { UploadModal } from '@/components/UploadModal';
import { AddPlaceModal } from '@/components/AddPlaceModal';
import { WishlistDrawer } from '@/components/WishlistDrawer';

function Shell() {
  const {
    tab, uploadOpen, setUploadOpen,
    addPlaceOpen, setAddPlaceOpen, setPrefilledComarca,
    wishlistOpen, setWishlistOpen,
    setFocusedSpotId, setTab,
    spotsRefreshKey, bumpSpotsRefresh,
  } = useApp();

  return (
    <div className="min-h-screen bg-sand-50 dark:bg-slate2-950 text-forest-900 dark:text-sand-100">
      <Header />
      <main>
        {tab === 'gallery' && <GalleryView refreshKey={spotsRefreshKey} />}
        {tab === 'rankings' && <RankingsView refreshKey={spotsRefreshKey} />}
        {tab === 'map' && <MapView refreshKey={spotsRefreshKey} />}
        {tab === 'passport' && <PassportView refreshKey={spotsRefreshKey} />}
      </main>

      {uploadOpen && <UploadModal onClose={() => setUploadOpen(false)} onUploaded={() => {}} />}
      {addPlaceOpen && (
        <AddPlaceModal
          onClose={() => { setAddPlaceOpen(false); setPrefilledComarca(null); }}
          onCreated={() => { bumpSpotsRefresh(); }}
        />
      )}
      {wishlistOpen && (
        <WishlistDrawer
          onClose={() => setWishlistOpen(false)}
          onOpenSpot={(id) => { setFocusedSpotId(id); setTab('map'); setWishlistOpen(false); }}
        />
      )}

      <footer className="border-t border-forest-100 dark:border-slate2-800 py-6 text-center text-xs text-forest-700/50 dark:text-sand-300/50">
        Ezetu · Conoce el mundo — {new Date().getFullYear()}
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <Shell />
    </AppProvider>
  );
}
