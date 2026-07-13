import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../client';
import { queryKeys } from '../queryKeys';
import type { UserProfileResponse } from '../types';

export function useProfile() {
  return useQuery({
    queryKey: queryKeys.profile,
    queryFn: async (): Promise<UserProfileResponse> => {
      const response = await apiClient.get('/api/me');
      return response.data;
    },
  });
}
