-- Perfil do ritmista: instrumento, bio e foto de avatar
ALTER TABLE public.membros
  ADD COLUMN IF NOT EXISTS instrumento TEXT,
  ADD COLUMN IF NOT EXISTS bio TEXT,
  ADD COLUMN IF NOT EXISTS avatar_url TEXT;
