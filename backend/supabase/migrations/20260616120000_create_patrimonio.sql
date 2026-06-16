-- Tabela de patrimonio da bateria (usada por patrimonioController.js)
CREATE TABLE IF NOT EXISTS public.patrimonio (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  categoria TEXT NOT NULL,
  codigo_patrimonio TEXT,
  estado_conservacao TEXT NOT NULL DEFAULT 'Bom',
  status TEXT NOT NULL DEFAULT 'Disponível',
  responsavel_id UUID REFERENCES public.membros(id) ON DELETE SET NULL,
  foto_url TEXT,
  localizacao TEXT,
  observacoes TEXT,
  data_aquisicao DATE,
  criado_por UUID REFERENCES public.membros(id) ON DELETE SET NULL,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_patrimonio_categoria ON public.patrimonio (categoria);
CREATE INDEX IF NOT EXISTS idx_patrimonio_status ON public.patrimonio (status);

ALTER TABLE public.patrimonio ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "patrimonio_select_anon" ON public.patrimonio;
DROP POLICY IF EXISTS "patrimonio_insert_anon" ON public.patrimonio;
DROP POLICY IF EXISTS "patrimonio_update_anon" ON public.patrimonio;
DROP POLICY IF EXISTS "patrimonio_delete_anon" ON public.patrimonio;

CREATE POLICY "patrimonio_select_anon"
  ON public.patrimonio FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "patrimonio_insert_anon"
  ON public.patrimonio FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "patrimonio_update_anon"
  ON public.patrimonio FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "patrimonio_delete_anon"
  ON public.patrimonio FOR DELETE
  TO anon, authenticated
  USING (true);
