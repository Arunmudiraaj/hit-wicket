import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../client';
import { queryKeys } from '../queryKeys';

export interface UpdateSettingsPayload {
  theme?: string;
  soundEnabled?: boolean;
}

export function useUpdateSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: UpdateSettingsPayload) => {
      const response = await apiClient.patch('/api/me/settings', payload);
      return response.data;
    },
    onSuccess: () => {
      // Invalidate profile query to refetch updated settings/profile data if it is tied to it
      queryClient.invalidateQueries({ queryKey: queryKeys.profile });
    },
  });
}
