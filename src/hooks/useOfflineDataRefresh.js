import useListAutoRefresh from './useListAutoRefresh';

/**
 * Re-run fetch when offline mode toggles, local queue changes, or a
 * create/update dispatches LIST_DATA_CHANGED_EVENT.
 */
export default function useOfflineDataRefresh(onRefresh, deps = [], scopes = null) {
  useListAutoRefresh(onRefresh, deps, scopes);
}
