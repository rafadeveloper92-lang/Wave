import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../services/supabaseClient';

export type ChatMessageRow = {
  id: string;
  room_key: string;
  sender_id: string;
  body: string;
  created_at: string;
};

export type UiMessage = {
  id: string;
  text: string;
  time: string;
  isMe: boolean;
};

function formatTime(iso: string) {
  try {
    return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
}

export function useChatMessages(roomKey: string | null, currentUserId: string | null) {
  const [rows, setRows] = useState<ChatMessageRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mapToUi = useCallback(
    (list: ChatMessageRow[]): UiMessage[] =>
      list.map((m) => ({
        id: m.id,
        text: m.body,
        time: formatTime(m.created_at),
        isMe: currentUserId != null && m.sender_id === currentUserId,
      })),
    [currentUserId]
  );

  const fetchMessages = useCallback(async () => {
    if (!roomKey || !currentUserId) return;
    setLoading(true);
    setError(null);
    const { data, error: qErr } = await supabase
      .from('chat_messages')
      .select('id, room_key, sender_id, body, created_at')
      .eq('room_key', roomKey)
      .order('created_at', { ascending: true })
      .limit(200);

    if (qErr) {
      setError(qErr.message);
      setRows([]);
    } else {
      setRows((data as ChatMessageRow[]) || []);
    }
    setLoading(false);
  }, [roomKey, currentUserId]);

  useEffect(() => {
    void fetchMessages();
  }, [fetchMessages]);

  useEffect(() => {
    if (!roomKey || !currentUserId) return;

    const channel = supabase
      .channel(`room:${roomKey}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `room_key=eq.${roomKey}`,
        },
        (payload) => {
          const row = payload.new as ChatMessageRow;
          setRows((prev) => {
            if (prev.some((r) => r.id === row.id)) return prev;
            return [...prev, row];
          });
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [roomKey, currentUserId]);

  const sendMessage = useCallback(
    async (body: string) => {
      if (!roomKey || !currentUserId || !body.trim()) return { error: 'Dados inválidos' };
      const { error: insErr } = await supabase.from('chat_messages').insert({
        room_key: roomKey,
        sender_id: currentUserId,
        body: body.trim(),
      });
      if (insErr) return { error: insErr.message };
      return { error: null as string | null };
    },
    [roomKey, currentUserId]
  );

  return {
    messages: mapToUi(rows),
    loading,
    error,
    refetch: fetchMessages,
    sendMessage,
  };
}
