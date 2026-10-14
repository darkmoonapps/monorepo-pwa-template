import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister';
import {
  defaultShouldDehydrateQuery,
  QueryClient,
  type Query,
} from '@tanstack/react-query';
import type { Persister } from '@tanstack/react-query-persist-client';

export const ITEMS_QUERY_ROOT = 'items' as const;

export const QUERY_CACHE_STORAGE_KEY = 'app-items-query-cache';

export const QUERY_PERSIST_MAX_AGE_MS = 24 * 60 * 60 * 1000;

export function itemDetailsQueryKey(
  itemId: string
): readonly [typeof ITEMS_QUERY_ROOT, string] {
  return [ITEMS_QUERY_ROOT, itemId];
}

export function isItemDetailsQueryKey(queryKey: readonly unknown[]): boolean {
  return queryKey[0] === ITEMS_QUERY_ROOT;
}

export function shouldPersistItemDetailsQuery(query: Query): boolean {
  return (
    defaultShouldDehydrateQuery(query) && isItemDetailsQueryKey(query.queryKey)
  );
}

export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: 1,
        staleTime: 10_000,
        gcTime: QUERY_PERSIST_MAX_AGE_MS,
        refetchOnWindowFocus: false,
      },
    },
  });
}

export function createItemDetailsPersister(throttleTime = 1000): Persister {
  return createSyncStoragePersister({
    storage: window.localStorage,
    key: QUERY_CACHE_STORAGE_KEY,
    throttleTime,
  });
}

export function shouldDehydrateMutation(): boolean {
  return false;
}
