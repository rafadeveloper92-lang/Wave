-- Mensagens de localização (JSON no body, sem media_path)
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
      OR (
        message_type = 'location'
        AND media_path IS NULL
        AND length(trim(body)) > 10
        AND length(body) < 2000
      )
    )
  );
