export function obterIniciais(nome: string): string {
  return nome
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join('');
}

export const ROTULO_PERFIL: Record<string, string> = {
  Administrador: 'Administrador',
  'Gestor de Módulo': 'Gestor',
  Membro: 'Membro',
};

export const INSTRUMENTOS = [
  'Surdo',
  'Surdo 2',
  'Caixa',
  'Repique',
  'Tamborim',
  'Chocalho',
  'Agogô',
  'Prato',
  'Outro',
] as const;

export type MembroPerfil = {
  id: string;
  nome: string;
  perfil_acesso?: string;
  instrumento?: string | null;
  bio?: string | null;
  avatar_url?: string | null;
  created_at?: string;
};

export type HistoricoPresenca = {
  id: string;
  data: string | null;
  categoria: string;
  peso: number;
  pontos: number;
};

export type Conquista = {
  codigo: string;
  titulo: string;
  descricao: string;
  icone: string;
  desbloqueada: boolean;
};

export type GamificacaoPerfil = {
  pontos: number;
  nivel: {
    numero: number;
    nome: string;
    icone?: string;
    progressoPct: number;
    proximoNivel: string | null;
    pontosParaProximo: number;
  };
  resumo: { presencas: number; faltas: number; frequencia: number };
  streak: number;
  conquistas: Conquista[];
  conquistasDesbloqueadas: number;
  conquistasTotal: number;
};

export type PerfilCompleto = {
  membro: MembroPerfil;
  gamificacao: GamificacaoPerfil;
  historico: HistoricoPresenca[];
};
