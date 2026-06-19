import { useCallback, useMemo, useState } from 'react';
import { STORAGE_KEYS } from '@morange/constants';
import { safeGetStorage, safeSetStorage, toggleArrayItem, uniqByRecent } from '@morange/utils';

export function useFavoriteApps() {
  const [favorites, setFavorites] = useState<string[]>(() =>
    safeGetStorage<string[]>(STORAGE_KEYS.favorites, [])
  );

  const toggleFavorite = useCallback((id: string) => {
    setFavorites((current) => {
      const next = toggleArrayItem(current, id);
      safeSetStorage(STORAGE_KEYS.favorites, next);
      return next;
    });
  }, []);

  const favoriteSet = useMemo(() => new Set(favorites), [favorites]);

  return { favorites, favoriteSet, toggleFavorite };
}

export function useRecentApps(limit = 8) {
  const [recentApps, setRecentApps] = useState<string[]>(() =>
    safeGetStorage<string[]>(STORAGE_KEYS.recentApps, [])
  );

  const recordRecentApp = useCallback(
    (id: string) => {
      setRecentApps((current) => {
        const next = uniqByRecent(current, id, limit);
        safeSetStorage(STORAGE_KEYS.recentApps, next);
        return next;
      });
    },
    [limit]
  );

  return { recentApps, recordRecentApp };
}
