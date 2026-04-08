-- Mensagens de voz: colunas em chat_messages + bucket Storage (executar no SQL Editor após ter a tabela chat_messages).
-- Se ainda não tens chat_messages, corre primeiro a migração base do projeto (001 ou equivalente).

-- Bucket para áudios (público para leitura simples no cliente; podes mudar para privado + URLs assinadas depois)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'chat-voice',
  'chat-voice',
  true,
  5242880,
  ARRAY['audio/webm', 'audio/webm;codecs=opus', 'audio/ogg', 'audio/mp4', 'audio/mpeg']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Colunas na tabela de mensagens (ajusta o nome da tabela se for diferente)
ALTER TABLE public.chat_messages
  ADD COLUMN IF NOT EXISTS message_type text NOT NULL DEFAULT 'text',
  ADD COLUMN IF NOT EXISTS media_path text,
  ADD COLUMN IF NOT EXISTS duration_sec integer;

UPDATE public.chat_messages SET message_type = 'text' WHERE message_type IS NULL;

-- Políticas Storage: leitura pública (bucket público), escrita só utilizadores autenticados
DROP POLICY IF EXISTS "chat_voice_select" ON storage.objects;
CREATE POLICY "chat_voice_select"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'chat-voice');

DROP POLICY IF EXISTS "chat_voice_insert" ON storage.objects;
CREATE POLICY "chat_voice_insert"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'chat-voice');

DROP POLICY IF EXISTS "chat_voice_update" ON storage.objects;
CREATE POLICY "chat_voice_update"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'chat-voice');

DROP POLICY IF EXISTS "chat_voice_delete" ON storage.objects;
CREATE POLICY "chat_voice_delete"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'chat-voice');

-- Atualizar RLS de chat_messages: permitir mensagem de voz (body pode ser vazio)
DROP POLICY IF EXISTS "chat_messages_insert_public_rooms" ON public.chat_messages;

CREATE POLICY "chat_messages_insert_public_rooms"
  ON public.chat_messages FOR INSERT
  TO authenticated
  WITH CHECK (
    room_key LIKE 'wave:public:%'
    AND sender_id = auth.uid()
    AND (
      (message_type = 'text' AND length(trim(body)) > 0 AND length(body) < 8000)
      OR (
        message_type = 'voice'
        AND media_path IS NOT NULL
        AND length(media_path) < 500
        AND duration_sec IS NOT NULL
        AND duration_sec > 0
        AND duration_sec <= 300
      )
    )
  );
