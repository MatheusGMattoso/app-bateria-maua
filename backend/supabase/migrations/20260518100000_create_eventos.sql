-- Tabela de eventos do calendario (usada por eventoController.js)
CREATE TABLE IF NOT EXISTS public.eventos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo TEXT NOT NULL,
  descricao TEXT,
  data_evento DATE NOT NULL,
  horario_evento TEXT NOT NULL DEFAULT '23:59',
  criado_por UUID REFERENCES public.membros(id) ON DELETE SET NULL,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_eventos_data_evento ON public.eventos (data_evento);

ALTER TABLE public.eventos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "eventos_select_anon" ON public.eventos;
DROP POLICY IF EXISTS "eventos_insert_anon" ON public.eventos;
DROP POLICY IF EXISTS "eventos_update_anon" ON public.eventos;
DROP POLICY IF EXISTS "eventos_delete_anon" ON public.eventos;

CREATE POLICY "eventos_select_anon"
  ON public.eventos FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "eventos_insert_anon"
  ON public.eventos FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "eventos_update_anon"
  ON public.eventos FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "eventos_delete_anon"
  ON public.eventos FOR DELETE
  TO anon, authenticated
  USING (true);
