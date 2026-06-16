-- Tokens push e preferencias de notificacao
CREATE TABLE IF NOT EXISTS public.push_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  membro_id UUID NOT NULL REFERENCES public.membros(id) ON DELETE CASCADE,
  expo_push_token TEXT NOT NULL,
  platform TEXT,
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (membro_id, expo_push_token)
);

CREATE TABLE IF NOT EXISTS public.notificacao_preferencias (
  membro_id UUID PRIMARY KEY REFERENCES public.membros(id) ON DELETE CASCADE,
  lembrete_ensaio BOOLEAN NOT NULL DEFAULT true,
  lembrete_dia BOOLEAN NOT NULL DEFAULT true,
  alerta_pae BOOLEAN NOT NULL DEFAULT true
);

CREATE TABLE IF NOT EXISTS public.notificacao_envios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  membro_id UUID REFERENCES public.membros(id) ON DELETE CASCADE,
  evento_id UUID,
  tipo TEXT NOT NULL,
  enviado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (membro_id, evento_id, tipo)
);

CREATE INDEX IF NOT EXISTS idx_push_tokens_membro ON public.push_tokens (membro_id);
CREATE INDEX IF NOT EXISTS idx_notificacao_envios_tipo ON public.notificacao_envios (tipo, enviado_em DESC);

ALTER TABLE public.push_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notificacao_preferencias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notificacao_envios ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "push_tokens_anon" ON public.push_tokens;
CREATE POLICY "push_tokens_anon"
  ON public.push_tokens FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "notificacao_preferencias_anon" ON public.notificacao_preferencias;
CREATE POLICY "notificacao_preferencias_anon"
  ON public.notificacao_preferencias FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "notificacao_envios_anon" ON public.notificacao_envios;
CREATE POLICY "notificacao_envios_anon"
  ON public.notificacao_envios FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);
