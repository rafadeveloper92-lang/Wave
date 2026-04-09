-- Presença (última vez visto) e recibos de leitura
-- Ative Realtime para UPDATE em public.chat_messages (além de INSERT) para ticks azuis ao vivo.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS last_seen_at TIMESTAMPTZ;

ALTER TABLE public.chat_messages
  ADD COLUMN IF NOT EXISTS read_at TIMESTAMPTZ;

-- Atualizar o próprio last_seen (heartbeat da app)
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
CREATE POLICY "profiles_update_own"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Marcar como lidas as mensagens que NÃO enviei (o outro atualiza as minhas quando abre o chat)
DROP POLICY IF EXISTS "chat_messages_update_read" ON public.chat_messages;
CREATE POLICY "chat_messages_update_read"
  ON public.chat_messages FOR UPDATE
  TO authenticated
  USING (
    room_key LIKE 'wave:public:%'
    AND sender_id <> auth.uid()
  )
  WITH CHECK (
    room_key LIKE 'wave:public:%'
    AND sender_id <> auth.uid()
  );
