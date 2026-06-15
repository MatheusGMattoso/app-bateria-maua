-- Feed / mural social (posts + reacoes)
CREATE TABLE IF NOT EXISTS public.posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  autor_id UUID NOT NULL REFERENCES public.membros(id) ON DELETE CASCADE,
  conteudo TEXT NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('aviso', 'post')),
  fixado BOOLEAN NOT NULL DEFAULT false,
  imagem_url TEXT,
  ativo BOOLEAN NOT NULL DEFAULT true,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.reacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  membro_id UUID NOT NULL REFERENCES public.membros(id) ON DELETE CASCADE,
  emoji TEXT NOT NULL CHECK (emoji IN ('🥭', '🥁', '🔥')),
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (post_id, membro_id)
);

CREATE INDEX IF NOT EXISTS idx_posts_criado_em ON public.posts (criado_em DESC);
CREATE INDEX IF NOT EXISTS idx_posts_fixado ON public.posts (fixado, criado_em DESC);
CREATE INDEX IF NOT EXISTS idx_reacoes_post_id ON public.reacoes (post_id);

ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reacoes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "posts_select_anon" ON public.posts;
DROP POLICY IF EXISTS "posts_insert_anon" ON public.posts;
DROP POLICY IF EXISTS "posts_update_anon" ON public.posts;
DROP POLICY IF EXISTS "posts_delete_anon" ON public.posts;

CREATE POLICY "posts_select_anon"
  ON public.posts FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "posts_insert_anon"
  ON public.posts FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "posts_update_anon"
  ON public.posts FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "posts_delete_anon"
  ON public.posts FOR DELETE
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "reacoes_select_anon" ON public.reacoes;
DROP POLICY IF EXISTS "reacoes_insert_anon" ON public.reacoes;
DROP POLICY IF EXISTS "reacoes_update_anon" ON public.reacoes;
DROP POLICY IF EXISTS "reacoes_delete_anon" ON public.reacoes;

CREATE POLICY "reacoes_select_anon"
  ON public.reacoes FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "reacoes_insert_anon"
  ON public.reacoes FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "reacoes_update_anon"
  ON public.reacoes FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "reacoes_delete_anon"
  ON public.reacoes FOR DELETE
  TO anon, authenticated
  USING (true);
