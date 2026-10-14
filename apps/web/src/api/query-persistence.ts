import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister';
import {
  defaultShouldDehydrateQuery,
  QueryClient,
  type Query,
} from '@tanstack/react-query';
import type { Persister } from '@tanstack/react-query-persist-client';

export const EXAMPLE_RESOURCE_DETAILS_QUERY_ROOT =
  'example-resource-details' as const;

export const QUERY_CACHE_STORAGE_KEY = 'app-example-query-cache';

export const QUERY_PERSIST_MAX_AGE_MS = 24 * 60 * 60 * 1000;

export function exampleResourceDetailsQueryKey(
  resourceId: string
): readonly [typeof EXAMPLE_RESOURCE_DETAILS_QUERY_ROOT, string] {
  return [EXAMPLE_RESOURCE_DETAILS_QUERY_ROOT, resourceId];
}

export function isExampleResourceDetailsQueryKey(
  queryKey: readonly unknown[]
): boolean {
  return queryKey[0] === EXAMPLE_RESOURCE_DETAILS_QUERY_ROOT;
}

export function shouldPersistExampleResourceDetailsQuery(
  query: Query
): boolean {
  return (
    defaultShouldDehydrateQuery(query) &&
    isExampleResourceDetailsQueryKey(query.queryKey)
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

export function createExampleResourcePersister(throttleTime = 1000): Persister {
  return createSyncStoragePersister({
    storage: window.localStorage,
    key: QUERY_CACHE_STORAGE_KEY,
    throttleTime,
  });
}

export function shouldDehydrateMutation(): boolean {
  return false;
}
