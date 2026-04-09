import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '../services/supabaseClient';
import type { RealtimeChannel } from '@supabase/supabase-js';

const ONLINE_SEC = 45;
const POLL_MS = 12000;

function formatLastSeen(iso: string | null): string {
  if (!iso) return 'Offline';
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  if (diffMs < ONLINE_SEC * 1000) return 'Online';
  const sameDay =
    d.getDate() === now.getDate() &&
    d.getMonth() === now.getMonth() &&
    d.getFullYear() === now.getFullYear();
  const time = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  if (sameDay) return `Visto hoje às ${time}`;
  const y = new Date(now);
  y.setDate(y.getDate() - 1);
  const yesterday =
    d.getDate() === y.getDate() && d.getMonth() === y.getMonth() && d.getFullYear() === y.getFullYear();
  if (yesterday) return `Visto ontem às ${time}`;
  return `Visto em ${d.toLocaleDateString([], { day: 'numeric', month: 'short' })} às ${time}`;
}

export function useMyPresenceHeartbeat(userId: string | null) {
  useEffect(() => {
    if (!userId) return;
    const pulse = () => {
      void supabase.from('profiles').update({ last_seen_at: new Date().toISOString() }).eq('id', userId);
    };
    pulse();
    const id = setInterval(pulse, 25000);
    return () => clearInterval(id);
  }, [userId]);
}

export function usePeerPresence(peerUserId: string | undefined, chatOnlineProp?: boolean) {
  const [subtitle, setSubtitle] = useState<string>(chatOnlineProp ? 'Online' : 'A carregar…');

  const load = useCallback(async () => {
    if (!peerUserId) {
      setSubtitle(chatOnlineProp ? 'Online' : 'Offline');
      return;
    }
    const { data, error } = await supabase
      .from('profiles')
      .select('last_seen_at')
      .eq('id', peerUserId)
      .maybeSingle();
    if (error || !data) {
      setSubtitle(chatOnlineProp ? 'Online' : 'Offline');
      return;
    }
    setSubtitle(formatLastSeen(data.last_seen_at as string | null));
  }, [peerUserId, chatOnlineProp]);

  useEffect(() => {
    void load();
    const id = setInterval(() => void load(), POLL_MS);
    return () => clearInterval(id);
  }, [load]);

  return { presenceSubtitle: subtitle, refetchPresence: load };
}

export function useTypingIndicator(roomKey: string | null, myUserId: string | null) {
  const [peerTyping, setPeerTyping] = useState(false);
  const [typingReady, setTypingReady] = useState(false);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    if (!roomKey || !myUserId) return;

    const ch = supabase.channel(`typing:${roomKey}`, { config: { broadcast: { self: false } } });
    channelRef.current = ch;
    setTypingReady(false);

    ch.on('broadcast', { event: 'typing' }, ({ payload }) => {
      const p = payload as { userId?: string; active?: boolean };
      if (!p || p.userId === myUserId) return;
      if (p.active) {
        setPeerTyping(true);
        if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
        hideTimerRef.current = setTimeout(() => setPeerTyping(false), 3500);
      } else {
        setPeerTyping(false);
      }
    });

    void ch.subscribe((status) => {
      if (status === 'SUBSCRIBED') setTypingReady(true);
    });
    return () => {
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
      channelRef.current = null;
      setTypingReady(false);
      void supabase.removeChannel(ch);
    };
  }, [roomKey, myUserId]);

  const sendTyping = useCallback(
    (active: boolean) => {
      const ch = channelRef.current;
      if (!ch || !myUserId || !typingReady) return;
      void ch.send({
        type: 'broadcast',
        event: 'typing',
        payload: { userId: myUserId, active },
      });
    },
    [myUserId, typingReady]
  );

  return { peerTyping, sendTyping };
}
