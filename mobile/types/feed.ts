export type AutorPost = {
  id: string;
  nome: string;
  perfil_acesso: string;
};

export type ReacoesContagem = {
  '🥭': number;
  '🥁': number;
  '🔥': number;
};

export type PostFeed = {
  id: string;
  conteudo: string;
  tipo: 'aviso' | 'post';
  fixado: boolean;
  imagem_url: string | null;
  criado_em: string;
  autor: AutorPost;
  reacoes: ReacoesContagem;
  minhaReacao: string | null;
  totalComentarios: number;
};

export type ComentarioFeed = {
  id: string;
  conteudo: string;
  criado_em: string;
  autor: AutorPost;
};

export const EMOJIS_REACAO = ['🥭', '🥁', '🔥'] as const;
export type EmojiReacao = (typeof EMOJIS_REACAO)[number];
