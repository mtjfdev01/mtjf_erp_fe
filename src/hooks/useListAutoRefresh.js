import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

export const LIST_DATA_CHANGED_EVENT = 'app-list-data-changed';

/**
 * Tell mounted listing screens to refetch (after create/update/sync).
 * @param {string} [scope] optional module hint e.g. 'aid' | 'donations'
 */
export function dispatchListDataChanged(scope = 'all') {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(
    new CustomEvent(LIST_DATA_CHANGED_EVENT, { detail: { scope } }),
  );
}

/**
 * Auto-refresh a list when offline queue/mode changes, a create/update
 * dispatches LIST_DATA_CHANGED_EVENT, the tab becomes visible again, or
 * the user navigates back to a still-mounted list (location.key).
 *
 * @param {() => void} onRefresh
 * @param {unknown[]} [deps]
 * @param {string[]|null} [scopes] if set, only react to matching scope (or 'all')
 */
export default function useListAutoRefresh(
  onRefresh,
  deps = [],
  scopes = null,
) {
  const location = useLocation();
  const skipNavRefresh = useRef(true);

  useEffect(() => {
    if (skipNavRefresh.current) {
      skipNavRefresh.current = false;
      return;
    }
    onRefresh?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.key]);

  useEffect(() => {
    const refresh = (e) => {
      if (scopes && e?.type === LIST_DATA_CHANGED_EVENT) {
        const scope = e.detail?.scope || 'all';
        if (scope !== 'all' && !scopes.includes(scope)) return;
      }
      onRefresh?.();
    };

    const onVis = () => {
      if (document.visibilityState === 'visible') onRefresh?.();
    };

    window.addEventListener('dms-offline-queue-changed', refresh);
    window.addEventListener('dms-offline-mode-changed', refresh);
    window.addEventListener('dms-offline-data-cleared', refresh);
    window.addEventListener(LIST_DATA_CHANGED_EVENT, refresh);
    document.addEventListener('visibilitychange', onVis);

    return () => {
      window.removeEventListener('dms-offline-queue-changed', refresh);
      window.removeEventListener('dms-offline-mode-changed', refresh);
      window.removeEventListener('dms-offline-data-cleared', refresh);
      window.removeEventListener(LIST_DATA_CHANGED_EVENT, refresh);
      document.removeEventListener('visibilitychange', onVis);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
