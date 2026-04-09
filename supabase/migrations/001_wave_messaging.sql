-- Wave: perfis, mensagens em salas "públicas" (prefixo wave:public:), tokens FCM.
-- Execute no SQL Editor do Supabase ou via CLI: supabase db push

-- Perfis (1:1 com auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_select_authenticated"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "profiles_insert_own"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (id = auth.uid());

CREATE POLICY "profiles_update_own"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(COALESCE(NEW.email, ''), '@', 1))
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Mensagens: salas com prefixo wave:public: visíveis a qualquer utilizador autenticado (demo/MVP).
CREATE TABLE IF NOT EXISTS public.chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_key TEXT NOT NULL,
  sender_id UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS chat_messages_room_created_idx
  ON public.chat_messages (room_key, created_at);

ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "chat_messages_select_public_rooms"
  ON public.chat_messages FOR SELECT
  TO authenticated
  USING (room_key LIKE 'wave:public:%');

CREATE POLICY "chat_messages_insert_public_rooms"
  ON public.chat_messages FOR INSERT
  TO authenticated
  WITH CHECK (
    room_key LIKE 'wave:public:%'
    AND sender_id = auth.uid()
    AND length(trim(body)) > 0
    AND length(body) < 8000
  );

-- Tokens push (FCM via Capacitor); envio real exige Edge Function ou backend com FCM server key.
CREATE TABLE IF NOT EXISTS public.push_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  token TEXT NOT NULL,
  platform TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, token)
);

ALTER TABLE public.push_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "push_tokens_select_own"
  ON public.push_tokens FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "push_tokens_upsert_own"
  ON public.push_tokens FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "push_tokens_update_own"
  ON public.push_tokens FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "push_tokens_delete_own"
  ON public.push_tokens FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Habilitar Realtime para novas mensagens (painel Supabase > Database > Replication)
-- ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
