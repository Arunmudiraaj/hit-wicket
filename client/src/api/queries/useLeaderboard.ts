import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../client';
import { queryKeys } from '../queryKeys';
import type { LeaderboardResponse } from '../types';

export function useLeaderboard(mode: string = 'all', period: string = 'all') {
  return useQuery({
    queryKey: queryKeys.leaderboard(mode, period),
    queryFn: async (): Promise<LeaderboardResponse> => {
      const response = await apiClient.get('/api/leaderboard', {
        params: { mode, period },
      });
      return response.data;
    },
  });
}
