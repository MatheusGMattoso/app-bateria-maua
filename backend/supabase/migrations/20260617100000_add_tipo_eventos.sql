-- Tipo do evento no calendario (ensaio, evento, show)
ALTER TABLE public.eventos
  ADD COLUMN IF NOT EXISTS tipo TEXT NOT NULL DEFAULT 'ensaio';

ALTER TABLE public.eventos
  DROP CONSTRAINT IF EXISTS eventos_tipo_check;

ALTER TABLE public.eventos
  ADD CONSTRAINT eventos_tipo_check CHECK (tipo IN ('ensaio', 'evento', 'show'));
