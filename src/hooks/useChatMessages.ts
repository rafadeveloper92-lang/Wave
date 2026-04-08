import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../services/supabaseClient';
import { safeStorageSegment } from '../lib/chatRooms';

export type ChatMessageRow = {
  id: string;
  room_key: string;
  sender_id: string;
  body: string;
  created_at: string;
  message_type?: string;
  media_path?: string | null;
  duration_sec?: number | null;
};

export type UiMessage = {
  id: string;
  kind: 'text' | 'voice';
  text: string;
  time: string;
  isMe: boolean;
  mediaUrl?: string;
  durationSec?: number;
};

const VOICE_BUCKET = 'chat-voice';

function formatTime(iso: string) {
  try {
    return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
}

function rowToUi(row: ChatMessageRow, currentUserId: string | null): UiMessage {
  const isVoice = row.message_type === 'voice' && row.media_path;
  let mediaUrl: string | undefined;
  if (isVoice && row.media_path) {
    const { data } = supabase.storage.from(VOICE_BUCKET).getPublicUrl(row.media_path);
    mediaUrl = data.publicUrl;
  }
  return {
    id: row.id,
    kind: isVoice ? 'voice' : 'text',
    text: isVoice ? '' : row.body,
    time: formatTime(row.created_at),
    isMe: currentUserId != null && row.sender_id === currentUserId,
    mediaUrl,
    durationSec: row.duration_sec ?? undefined,
  };
}

export function useChatMessages(roomKey: string | null, currentUserId: string | null) {
  const [rows, setRows] = useState<ChatMessageRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mapToUi = useCallback(
    (list: ChatMessageRow[]): UiMessage[] => list.map((r) => rowToUi(r, currentUserId)),
    [currentUserId]
  );

  const fetchMessages = useCallback(async () => {
    if (!roomKey || !currentUserId) return;
    setLoading(true);
    setError(null);
    const { data, error: qErr } = await supabase
      .from('chat_messages')
      .select('id, room_key, sender_id, body, created_at, message_type, media_path, duration_sec')
      .eq('room_key', roomKey)
      .order('created_at', { ascending: true })
      .limit(300);

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
        message_type: 'text',
      });
      if (insErr) return { error: insErr.message };
      return { error: null as string | null };
    },
    [roomKey, currentUserId]
  );

  const sendVoiceMessage = useCallback(
    async (blob: Blob, durationSec: number) => {
      if (!roomKey || !currentUserId) return { error: 'Sessão ou sala inválida' };
      if (durationSec < 0.4) return { error: 'Gravação demasiado curta' };

      const {
        data: { user },
        error: userErr,
      } = await supabase.auth.getUser();
      if (userErr || !user) return { error: 'Inicie sessão para enviar áudio.' };

      const ext = blob.type.includes('mp4') ? 'm4a' : 'webm';
      const path = `${user.id}/${safeStorageSegment(roomKey)}/${crypto.randomUUID()}.${ext}`;

      const { error: upErr } = await supabase.storage.from(VOICE_BUCKET).upload(path, blob, {
        contentType: blob.type || 'audio/webm',
        upsert: false,
      });
      if (upErr) return { error: upErr.message };

      const dur = Math.min(300, Math.max(1, Math.round(durationSec)));
      const { error: insErr } = await supabase.from('chat_messages').insert({
        room_key: roomKey,
        sender_id: currentUserId,
        body: '',
        message_type: 'voice',
        media_path: path,
        duration_sec: dur,
      });
      if (insErr) {
        void supabase.storage.from(VOICE_BUCKET).remove([path]);
        return { error: insErr.message };
      }
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
    sendVoiceMessage,
  };
}
