import { dehydrate, QueryClient } from '@tanstack/react-query';
import { afterEach, describe, expect, it } from 'vitest';
import { waitFor } from '@testing-library/react';
import {
  ITEMS_QUERY_ROOT,
  QUERY_CACHE_STORAGE_KEY,
  createItemDetailsPersister,
  itemDetailsQueryKey,
  isItemDetailsQueryKey,
  shouldDehydrateMutation,
  shouldPersistItemDetailsQuery,
} from './query-persistence';

describe('items query persistence', () => {
  afterEach(() => {
    window.localStorage.clear();
  });

  it('identifies items details query keys', () => {
    expect(isItemDetailsQueryKey(itemDetailsQueryKey('item-1'))).toBe(true);
    expect(isItemDetailsQueryKey(['/api/health'])).toBe(false);
    expect(itemDetailsQueryKey('item-1')[0]).toBe(ITEMS_QUERY_ROOT);
  });

  it('does not persist mutations', () => {
    expect(shouldDehydrateMutation()).toBe(false);
  });

  it('persists only items details queries to localStorage', async () => {
    const queryClient = new QueryClient();
    queryClient.setQueryData(itemDetailsQueryKey('item-1'), {
      title: 'Example item',
      notes: 'Cached for offline use',
    });
    queryClient.setQueryData(['/api/health'], {
      status: 'healthy',
      timestamp: '2026-01-15T10:00:00.000Z',
      database: { connected: true },
    });

    const detailsQuery = queryClient
      .getQueryCache()
      .find({ queryKey: itemDetailsQueryKey('item-1') });
    const healthQuery = queryClient
      .getQueryCache()
      .find({ queryKey: ['/api/health'] });

    expect(detailsQuery).toBeDefined();
    expect(healthQuery).toBeDefined();
    if (detailsQuery === undefined || healthQuery === undefined) {
      throw new Error('expected health and items queries');
    }
    expect(shouldPersistItemDetailsQuery(detailsQuery)).toBe(true);
    expect(shouldPersistItemDetailsQuery(healthQuery)).toBe(false);

    const clientState = dehydrate(queryClient, {
      shouldDehydrateQuery: shouldPersistItemDetailsQuery,
      shouldDehydrateMutation,
    });
    expect(clientState.queries).toHaveLength(1);
    expect(clientState.queries[0]?.queryKey).toEqual(
      itemDetailsQueryKey('item-1')
    );

    void createItemDetailsPersister(0).persistClient({
      timestamp: Date.now(),
      buster: '',
      clientState,
    });

    await waitFor(() => {
      const stored = window.localStorage.getItem(QUERY_CACHE_STORAGE_KEY);
      expect(stored).toContain(ITEMS_QUERY_ROOT);
      expect(stored).toContain('item-1');
      expect(stored).not.toContain('/api/health');
    });
  });
});
