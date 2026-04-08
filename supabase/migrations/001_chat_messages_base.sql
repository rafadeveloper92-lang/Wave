-- Base opcional: só executa se ainda NÃO tens a tabela chat_messages.
-- Se já tens mensagens a funcionar, podes ignorar este ficheiro e usar só 002_voice_messages.sql

CREATE TABLE IF NOT EXISTS public.chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_key TEXT NOT NULL,
  sender_id UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  body TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS chat_messages_room_created_idx
  ON public.chat_messages (room_key, created_at);

ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "chat_messages_select_public_rooms" ON public.chat_messages;
CREATE POLICY "chat_messages_select_public_rooms"
  ON public.chat_messages FOR SELECT
  TO authenticated
  USING (room_key LIKE 'wave:public:%');

DROP POLICY IF EXISTS "chat_messages_insert_public_rooms" ON public.chat_messages;
CREATE POLICY "chat_messages_insert_public_rooms"
  ON public.chat_messages FOR INSERT
  TO authenticated
  WITH CHECK (
    room_key LIKE 'wave:public:%'
    AND sender_id = auth.uid()
    AND length(trim(body)) > 0
    AND length(body) < 8000
  );

-- Realtime: adicionar chat_messages à publication supabase_realtime no painel.
