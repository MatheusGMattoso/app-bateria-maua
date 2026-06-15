-- Comentarios do feed (fase 2)
CREATE TABLE IF NOT EXISTS public.comentarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  autor_id UUID NOT NULL REFERENCES public.membros(id) ON DELETE CASCADE,
  conteudo TEXT NOT NULL,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_comentarios_post_id ON public.comentarios (post_id, criado_em ASC);

ALTER TABLE public.comentarios ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "comentarios_select_anon" ON public.comentarios;
DROP POLICY IF EXISTS "comentarios_insert_anon" ON public.comentarios;
DROP POLICY IF EXISTS "comentarios_delete_anon" ON public.comentarios;

CREATE POLICY "comentarios_select_anon"
  ON public.comentarios FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "comentarios_insert_anon"
  ON public.comentarios FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "comentarios_delete_anon"
  ON public.comentarios FOR DELETE
  TO anon, authenticated
  USING (true);
