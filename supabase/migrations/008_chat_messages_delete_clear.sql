-- Limpar conversa no app: DELETE por room_key.
-- DM (wave:public:dm:uuid:uuid): podes apagar todas as mensagens da sala se fores um dos dois UUIDs.
-- Grupo: só remove as tuas próprias mensagens (até haver modelo de membros).

DROP POLICY IF EXISTS "chat_messages_delete_dm_participant" ON public.chat_messages;
CREATE POLICY "chat_messages_delete_dm_participant"
  ON public.chat_messages FOR DELETE
  TO authenticated
  USING (
    room_key ~ '^wave:public:dm:[0-9a-f-]{36}:[0-9a-f-]{36}$'
    AND (
      split_part(room_key, ':', 4) = auth.uid()::text
      OR split_part(room_key, ':', 5) = auth.uid()::text
    )
  );

DROP POLICY IF EXISTS "chat_messages_delete_own_in_group_room" ON public.chat_messages;
CREATE POLICY "chat_messages_delete_own_in_group_room"
  ON public.chat_messages FOR DELETE
  TO authenticated
  USING (
    room_key LIKE 'wave:public:group:%'
    AND sender_id = auth.uid()
  );
