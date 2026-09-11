import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

export function useSession() {
  return useQuery({
    queryKey: ['session'],
    queryFn: async () => (await supabase.auth.getSession()).data.session,
  });
}
