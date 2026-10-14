import { healthResponseSchema, type HealthResponse } from '@app/shared';
import { useGetHealth } from './generated/api';

export function useHealthQuery(): ReturnType<typeof useGetHealth> {
  return useGetHealth({
    query: {
      refetchInterval: 30_000,
      select: (data: HealthResponse): HealthResponse => {
        return healthResponseSchema.parse(data);
      },
    },
  });
}
