-- Permite INSERT de mensagens com body vazio (voz usa body ''; localização usa JSON no body — já coberto).
-- Executa no SQL Editor se ainda tiveres a política antiga que exige trim(body) > 0.

DROP POLICY IF EXISTS "chat_messages_insert_public_rooms" ON public.chat_messages;
CREATE POLICY "chat_messages_insert_public_rooms"
  ON public.chat_messages FOR INSERT
  TO authenticated
  WITH CHECK (
    room_key LIKE 'wave:public:%'
    AND sender_id = auth.uid()
    AND length(coalesce(body, '')) < 8000
    AND (
      message_type = 'voice'
      OR message_type = 'image'
      OR message_type = 'video'
      OR message_type = 'location'
      OR length(trim(coalesce(body, ''))) > 0
    )
  );
