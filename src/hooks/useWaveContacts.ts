import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../services/supabaseClient';

export type WaveContact = {
  id: string;
  name: string;
  avatar: string;
  status: string;
};

const FALLBACK_AVATAR = (seed: string) =>
  `https://i.pravatar.cc/150?u=${encodeURIComponent(seed.slice(0, 12))}`;

export function useWaveContacts(enabled: boolean) {
  const [contacts, setContacts] = useState<WaveContact[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [myUserId, setMyUserId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!enabled) {
      setContacts([]);
      setError(null);
      return;
    }
    setLoading(true);
    setError(null);

    const {
      data: { user },
      error: userErr,
    } = await supabase.auth.getUser();
    if (userErr || !user) {
      setMyUserId(null);
      setContacts([]);
      setError('Inicie sessão para ver contactos na Wave.');
      setLoading(false);
      return;
    }
    setMyUserId(user.id);

    const { data, error: qErr } = await supabase
      .from('profiles')
      .select('id, display_name, avatar_url')
      .neq('id', user.id)
      .order('display_name', { ascending: true, nullsFirst: false })
      .limit(200);

    if (qErr) {
      setError(qErr.message);
      setContacts([]);
    } else {
      setContacts(
        (data || []).map((row: { id: string; display_name: string | null; avatar_url: string | null }) => ({
          id: row.id,
          name: row.display_name?.trim() || 'Utilizador',
          avatar: row.avatar_url?.trim() || FALLBACK_AVATAR(row.id),
          status: 'Na Wave',
        }))
      );
    }
    setLoading(false);
  }, [enabled]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!enabled) return;
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      void load();
    });
    return () => subscription.unsubscribe();
  }, [enabled, load]);

  return { contacts, loading, error, refetch: load, myUserId };
}
