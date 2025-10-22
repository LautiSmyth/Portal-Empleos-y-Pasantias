import { supabase } from './supabaseClient';

export function subscribeToApplications(onNewApp: (payload: any) => void) {
  return supabase
    .channel('apps-inserts')
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'applications' }, onNewApp)
    .subscribe();
}