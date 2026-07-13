import { QueryClient, QueryCache, MutationCache } from '@tanstack/react-query';
import { toast } from 'sonner';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
  queryCache: new QueryCache({
    onError: (error: any) => {
      console.error('Query Error:', error);
      toast.error(error.response?.data?.error || 'Failed to fetch data');
    },
  }),
  mutationCache: new MutationCache({
    onError: (error: any) => {
      console.error('Mutation Error:', error);
      toast.error(error.response?.data?.error || 'Operation failed');
    },
  }),
});
