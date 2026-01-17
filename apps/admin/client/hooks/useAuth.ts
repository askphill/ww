import {useQuery, useMutation, useQueryClient} from '@tanstack/react-query';
import {api} from '../lib/api';

export function useAuth() {
  const queryClient = useQueryClient();

  const {data, isLoading, error} = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: api.auth.me,
    retry: false,
  });

  const sendMagicLink = useMutation({
    mutationFn: api.auth.sendMagicLink,
  });

  const logout = useMutation({
    mutationFn: api.auth.logout,
    onSuccess: () => {
      queryClient.setQueryData(['auth', 'me'], null);
      window.location.href = '/login';
    },
  });

  return {
    user: data?.user ?? null,
    isLoading,
    error,
    sendMagicLink,
    logout,
  };
}
