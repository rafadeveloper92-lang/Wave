-- Imagens e vídeos curtos no chat (bucket chat-media + política INSERT atualizada)
-- Executar no SQL Editor depois de 001/002.

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'chat-media',
  'chat-media',
  true,
  26214400,
  ARRAY[
    'image/jpeg', 'image/png', 'image/webp', 'image/gif',
    'video/mp4', 'video/webm', 'video/quicktime'
  ]
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "chat_media_select" ON storage.objects;
CREATE POLICY "chat_media_select"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'chat-media');

DROP POLICY IF EXISTS "chat_media_insert" ON storage.objects;
CREATE POLICY "chat_media_insert"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'chat-media');

DROP POLICY IF EXISTS "chat_media_update" ON storage.objects;
CREATE POLICY "chat_media_update"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'chat-media');

DROP POLICY IF EXISTS "chat_media_delete" ON storage.objects;
CREATE POLICY "chat_media_delete"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'chat-media');

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
      OR (
        message_type = 'image'
        AND media_path IS NOT NULL
        AND length(media_path) < 500
        AND length(coalesce(body, '')) < 2000
      )
      OR (
        message_type = 'video'
        AND media_path IS NOT NULL
        AND length(media_path) < 500
        AND length(coalesce(body, '')) < 2000
        AND duration_sec IS NOT NULL
        AND duration_sec > 0
        AND duration_sec <= 120
      )
    )
  );
