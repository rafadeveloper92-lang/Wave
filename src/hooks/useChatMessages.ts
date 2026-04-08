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

export type LocationPayload = { lat: number; lng: number; label?: string };

export type UiMessage = {
  id: string;
  kind: 'text' | 'voice' | 'image' | 'video' | 'location';
  text: string;
  time: string;
  isMe: boolean;
  mediaUrl?: string;
  durationSec?: number;
  location?: LocationPayload;
};

const VOICE_BUCKET = 'chat-voice';
const MEDIA_BUCKET = 'chat-media';

function formatTime(iso: string) {
  try {
    return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
}

function publicUrl(bucket: string, path: string) {
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

function parseLocationBody(body: string): LocationPayload | null {
  try {
    const o = JSON.parse(body) as { lat?: number; lng?: number; label?: string };
    if (typeof o.lat !== 'number' || typeof o.lng !== 'number') return null;
    if (!Number.isFinite(o.lat) || !Number.isFinite(o.lng)) return null;
    return { lat: o.lat, lng: o.lng, label: typeof o.label === 'string' ? o.label : undefined };
  } catch {
    return null;
  }
}

function rowToUi(row: ChatMessageRow, currentUserId: string | null): UiMessage {
  const mt = row.message_type || 'text';
  let mediaUrl: string | undefined;
  if (row.media_path) {
    if (mt === 'voice') mediaUrl = publicUrl(VOICE_BUCKET, row.media_path);
    else if (mt === 'image' || mt === 'video') mediaUrl = publicUrl(MEDIA_BUCKET, row.media_path);
  }

  if (mt === 'location') {
    const loc = parseLocationBody(row.body);
    if (!loc) {
      return {
        id: row.id,
        kind: 'text',
        text: row.body,
        time: formatTime(row.created_at),
        isMe: currentUserId != null && row.sender_id === currentUserId,
      };
    }
    return {
      id: row.id,
      kind: 'location',
      text: loc.label || 'Localização',
      time: formatTime(row.created_at),
      isMe: currentUserId != null && row.sender_id === currentUserId,
      location: loc,
    };
  }

  if (mt === 'voice' && row.media_path) {
    return {
      id: row.id,
      kind: 'voice',
      text: '',
      time: formatTime(row.created_at),
      isMe: currentUserId != null && row.sender_id === currentUserId,
      mediaUrl,
      durationSec: row.duration_sec ?? undefined,
    };
  }
  if (mt === 'image' && row.media_path) {
    return {
      id: row.id,
      kind: 'image',
      text: row.body || '',
      time: formatTime(row.created_at),
      isMe: currentUserId != null && row.sender_id === currentUserId,
      mediaUrl,
    };
  }
  if (mt === 'video' && row.media_path) {
    return {
      id: row.id,
      kind: 'video',
      text: row.body || '',
      time: formatTime(row.created_at),
      isMe: currentUserId != null && row.sender_id === currentUserId,
      mediaUrl,
      durationSec: row.duration_sec ?? undefined,
    };
  }
  return {
    id: row.id,
    kind: 'text',
    text: row.body,
    time: formatTime(row.created_at),
    isMe: currentUserId != null && row.sender_id === currentUserId,
  };
}

function extForMime(mime: string): string {
  if (mime.includes('png')) return 'png';
  if (mime.includes('webp')) return 'webp';
  if (mime.includes('gif')) return 'gif';
  if (mime.includes('jpeg') || mime.includes('jpg')) return 'jpg';
  if (mime.includes('webm')) return 'webm';
  if (mime.includes('quicktime')) return 'mov';
  return 'mp4';
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

  const sendLocationMessage = useCallback(
    async (lat: number, lng: number, label?: string) => {
      if (!roomKey || !currentUserId) return { error: 'Sessão inválida' };
      const payload = JSON.stringify({
        lat,
        lng,
        label: label?.trim() || undefined,
      });
      const { error: insErr } = await supabase.from('chat_messages').insert({
        room_key: roomKey,
        sender_id: currentUserId,
        body: payload,
        message_type: 'location',
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

  const sendMediaMessage = useCallback(
    async (file: File, caption: string, durationSec: number | null) => {
      if (!roomKey || !currentUserId) return { error: 'Sessão ou sala inválida' };

      const {
        data: { user },
        error: userErr,
      } = await supabase.auth.getUser();
      if (userErr || !user) return { error: 'Inicie sessão para enviar mídia.' };

      const isImage = file.type.startsWith('image/');
      const isVideo = file.type.startsWith('video/');
      if (!isImage && !isVideo) return { error: 'Ficheiro inválido' };

      const messageType = isImage ? 'image' : 'video';
      const ext = extForMime(file.type);
      const path = `${user.id}/${safeStorageSegment(roomKey)}/${crypto.randomUUID()}.${ext}`;

      const { error: upErr } = await supabase.storage.from(MEDIA_BUCKET).upload(path, file, {
        contentType: file.type,
        upsert: false,
      });
      if (upErr) return { error: upErr.message };

      const cap = caption.trim().slice(0, 2000);
      const insertRow: Record<string, unknown> = {
        room_key: roomKey,
        sender_id: currentUserId,
        body: cap,
        message_type: messageType,
        media_path: path,
      };
      if (isVideo && durationSec != null) {
        insertRow.duration_sec = Math.min(120, Math.max(1, Math.round(durationSec)));
      }

      const { error: insErr } = await supabase.from('chat_messages').insert(insertRow);
      if (insErr) {
        void supabase.storage.from(MEDIA_BUCKET).remove([path]);
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
    sendMediaMessage,
    sendLocationMessage,
  };
}
