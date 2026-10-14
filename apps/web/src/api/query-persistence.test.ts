import { dehydrate, QueryClient } from '@tanstack/react-query';
import { afterEach, describe, expect, it } from 'vitest';
import { waitFor } from '@testing-library/react';
import {
  EXAMPLE_RESOURCE_DETAILS_QUERY_ROOT,
  QUERY_CACHE_STORAGE_KEY,
  createExampleResourcePersister,
  exampleResourceDetailsQueryKey,
  isExampleResourceDetailsQueryKey,
  shouldDehydrateMutation,
  shouldPersistExampleResourceDetailsQuery,
} from './query-persistence';

describe('example-resource query persistence', () => {
  afterEach(() => {
    window.localStorage.clear();
  });

  it('identifies example-resource details query keys', () => {
    expect(
      isExampleResourceDetailsQueryKey(exampleResourceDetailsQueryKey('item-1'))
    ).toBe(true);
    expect(isExampleResourceDetailsQueryKey(['/api/health'])).toBe(false);
    expect(exampleResourceDetailsQueryKey('item-1')[0]).toBe(
      EXAMPLE_RESOURCE_DETAILS_QUERY_ROOT
    );
  });

  it('does not persist mutations', () => {
    expect(shouldDehydrateMutation()).toBe(false);
  });

  it('persists only example-resource details queries to localStorage', async () => {
    const queryClient = new QueryClient();
    queryClient.setQueryData(exampleResourceDetailsQueryKey('item-1'), {
      title: 'Example resource',
      notes: 'Cached for offline use',
    });
    queryClient.setQueryData(['/api/health'], {
      status: 'healthy',
      timestamp: '2026-01-15T10:00:00.000Z',
      database: { connected: true },
    });

    const detailsQuery = queryClient
      .getQueryCache()
      .find({ queryKey: exampleResourceDetailsQueryKey('item-1') });
    const healthQuery = queryClient
      .getQueryCache()
      .find({ queryKey: ['/api/health'] });

    expect(detailsQuery).toBeDefined();
    expect(healthQuery).toBeDefined();
    if (detailsQuery === undefined || healthQuery === undefined) {
      throw new Error('expected health and example-resource queries');
    }
    expect(shouldPersistExampleResourceDetailsQuery(detailsQuery)).toBe(true);
    expect(shouldPersistExampleResourceDetailsQuery(healthQuery)).toBe(false);

    const clientState = dehydrate(queryClient, {
      shouldDehydrateQuery: shouldPersistExampleResourceDetailsQuery,
      shouldDehydrateMutation,
    });
    expect(clientState.queries).toHaveLength(1);
    expect(clientState.queries[0]?.queryKey).toEqual(
      exampleResourceDetailsQueryKey('item-1')
    );

    void createExampleResourcePersister(0).persistClient({
      timestamp: Date.now(),
      buster: '',
      clientState,
    });

    await waitFor(() => {
      const stored = window.localStorage.getItem(QUERY_CACHE_STORAGE_KEY);
      expect(stored).toContain(EXAMPLE_RESOURCE_DETAILS_QUERY_ROOT);
      expect(stored).toContain('item-1');
      expect(stored).not.toContain('/api/health');
    });
  });
});
