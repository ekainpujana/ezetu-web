import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

if (!url || !anon) {
  // Hard fail visibly rather than silently rendering empty screens.
  console.error('[Ezetu] Missing Supabase env vars. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
}

export const supabase = createClient(url ?? '', anon ?? '', {
  auth: { persistSession: false },
});

const DEVICE_KEY = 'ezetu.device_id';

export function getDeviceId(): string {
  try {
    let id = localStorage.getItem(DEVICE_KEY);
    if (!id) {
      id = (crypto as Crypto & { randomUUID?: () => string }).randomUUID?.() ??
        `dev-${Math.random().toString(36).slice(2)}-${Date.now().toString(36)}`;
      localStorage.setItem(DEVICE_KEY, id);
    }
    return id;
  } catch {
    return `dev-fallback-${Math.random().toString(36).slice(2)}`;
  }
}
