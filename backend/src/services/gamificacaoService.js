const supabase = require('../config/supabase');

// Niveis tematicos do Clube da Manga. Ordenados por pontos minimos crescentes.
const NIVEIS = [
  { numero: 1, nome: 'Semente', min: 0, icone: '🌱' },
  { numero: 2, nome: 'Broto', min: 8, icone: '🌿' },
  { numero: 3, nome: 'Manga Verde', min: 20, icone: '🥭' },
  { numero: 4, nome: 'Manga Madura', min: 40, icone: '🧡' },
  { numero: 5, nome: 'Ouro Mauá', min: 70, icone: '🏆' },
];

// Definicao das conquistas. O criterio recebe o contexto calculado e devolve boolean.
const CONQUISTAS = [
  {
    codigo: 'primeira_presenca',
    titulo: 'Primeiro passo',
    descricao: 'Registrou a primeira presença.',
    icone: '👣',
    criterio: (ctx) => ctx.totalPresencas >= 1,
  },
  {
    codigo: 'ritmista_assiduo',
    titulo: 'Ritmista assíduo',
    descricao: 'Compareceu a 5 ensaios ou eventos.',
    icone: '🥁',
    criterio: (ctx) => ctx.totalPresencas >= 5,
  },
  {
    codigo: 'fiel_manga',
    titulo: 'Fiel à manga',
    descricao: 'Compareceu a 15 ensaios ou eventos.',
    icone: '🧡',
    criterio: (ctx) => ctx.totalPresencas >= 15,
  },
  {
    codigo: 'evento_ouro',
    titulo: 'Presença de ouro',
    descricao: 'Esteve presente em um evento de grande porte.',
    icone: '🌟',
    criterio: (ctx) => ctx.temEventoOuro,
  },
  {
    codigo: 'frequencia_70',
    titulo: 'PAE no trilho',
    descricao: 'Atingiu 70% de frequência nos ensaios.',
    icone: '✅',
    criterio: (ctx) => ctx.frequencia >= 70,
  },
  {
    codigo: 'frequencia_100',
    titulo: 'Manga perfeita',
    descricao: 'Atingiu 100% de frequência nos ensaios.',
    icone: '💯',
    criterio: (ctx) => ctx.frequencia >= 100,
  },
  {
    codigo: 'streak_3',
    titulo: 'Sequência de 3',
    descricao: 'Compareceu a 3 ensaios consecutivos.',
    icone: '🔥',
    criterio: (ctx) => ctx.streak >= 3,
  },
];

function calcularPontos(presencas) {
  return presencas.reduce((soma, p) => soma + (p.ensaios?.peso || 1), 0);
}

function calcularNivel(pontos) {
  let atual = NIVEIS[0];
  for (const nivel of NIVEIS) {
    if (pontos >= nivel.min) atual = nivel;
  }

  const proximo = NIVEIS.find((n) => n.min > atual.min) || null;

  let progressoPct = 100;
  let pontosParaProximo = 0;

  if (proximo) {
    const intervalo = proximo.min - atual.min;
    progressoPct = intervalo > 0 ? Math.round(((pontos - atual.min) / intervalo) * 100) : 0;
    if (progressoPct > 100) progressoPct = 100;
    if (progressoPct < 0) progressoPct = 0;
    pontosParaProximo = Math.max(proximo.min - pontos, 0);
  }

  return {
    numero: atual.numero,
    nome: atual.nome,
    icone: atual.icone,
    progressoPct,
    proximoNivel: proximo ? proximo.nome : null,
    pontosParaProximo,
  };
}

// Ordena registros por created_at quando disponivel; caso contrario mantem a ordem original.
function ordenarPorData(registros) {
  const temData = registros.length > 0 && registros[0].created_at;
  if (!temData) return registros;
  return [...registros].sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
}

function calcularStreak(presencas, ensaios) {
  const ensaiosOrdenados = ordenarPorData(ensaios.filter((e) => e.categoria === 'ensaio'));
  const idsComparecidos = new Set(
    presencas.filter((p) => p.ensaios?.categoria === 'ensaio').map((p) => p.ensaio_id)
  );

  let streak = 0;
  for (let i = ensaiosOrdenados.length - 1; i >= 0; i -= 1) {
    if (idsComparecidos.has(ensaiosOrdenados[i].id)) {
      streak += 1;
    } else {
      break;
    }
  }
  return streak;
}

function calcularFrequencia(presencas, ensaios) {
  const totalPontosPossiveis = ensaios
    .filter((e) => e.categoria === 'ensaio')
    .reduce((soma, e) => soma + (e.peso || 1), 0);

  const pontosEnsaios = presencas
    .filter((p) => p.ensaios?.categoria === 'ensaio')
    .reduce((soma, p) => soma + (p.ensaios?.peso || 1), 0);

  let frequencia = totalPontosPossiveis > 0 ? Math.round((pontosEnsaios / totalPontosPossiveis) * 100) : 0;
  if (frequencia > 100) frequencia = 100;

  const qtdeEnsaiosTotais = ensaios.filter((e) => e.categoria === 'ensaio').length;
  const qtdeEnsaiosComparecidos = presencas.filter((p) => p.ensaios?.categoria === 'ensaio').length;
  const faltas = qtdeEnsaiosTotais - qtdeEnsaiosComparecidos;

  return { frequencia, faltas: faltas >= 0 ? faltas : 0, comparecimentos: presencas.length };
}

function montarContexto(presencas, ensaios) {
  const { frequencia } = calcularFrequencia(presencas, ensaios);
  const streak = calcularStreak(presencas, ensaios);
  const temEventoOuro = presencas.some(
    (p) => p.ensaios?.categoria === 'evento' && (p.ensaios?.peso || 0) >= 3
  );

  return {
    totalPresencas: presencas.length,
    frequencia,
    streak,
    temEventoOuro,
  };
}

function avaliarConquistas(contexto) {
  return CONQUISTAS.map((c) => ({
    codigo: c.codigo,
    titulo: c.titulo,
    descricao: c.descricao,
    icone: c.icone,
    desbloqueada: c.criterio(contexto),
  }));
}

async function buscarEnsaios() {
  const { data, error } = await supabase.from('ensaios').select('*');
  if (error) throw error;
  return data || [];
}

async function buscarPresencasDoMembro(membroId) {
  const { data, error } = await supabase
    .from('presencas')
    .select('id, ensaio_id, ensaios(peso, categoria)')
    .eq('membro_id', membroId);
  if (error) throw error;
  return data || [];
}

// Resumo usado pela rota legada /presencas/resumo (mantem o contrato existente).
async function obterResumoPresenca(membroId) {
  const [ensaios, presencas] = await Promise.all([buscarEnsaios(), buscarPresencasDoMembro(membroId)]);
  const { frequencia, faltas, comparecimentos } = calcularFrequencia(presencas, ensaios);
  return { presencas: comparecimentos, faltas, frequencia };
}

async function montarPerfilGamificacao(membroId) {
  const { data: membro, error: erroMembro } = await supabase
    .from('membros')
    .select('id, nome')
    .eq('id', membroId)
    .single();

  if (erroMembro || !membro) {
    const erro = new Error('Membro não encontrado.');
    erro.status = 404;
    throw erro;
  }

  const [ensaios, presencas] = await Promise.all([buscarEnsaios(), buscarPresencasDoMembro(membroId)]);

  const pontos = calcularPontos(presencas);
  const nivel = calcularNivel(pontos);
  const { frequencia, faltas, comparecimentos } = calcularFrequencia(presencas, ensaios);
  const contexto = montarContexto(presencas, ensaios);
  const conquistas = avaliarConquistas(contexto);
  const conquistasDesbloqueadas = conquistas.filter((c) => c.desbloqueada).length;

  return {
    membro: { id: membro.id, nome: membro.nome },
    pontos,
    nivel,
    resumo: { presencas: comparecimentos, faltas, frequencia },
    streak: contexto.streak,
    conquistas,
    conquistasDesbloqueadas,
    conquistasTotal: conquistas.length,
  };
}

async function montarRanking(limite = 10) {
  const { data: membros, error: erroMembros } = await supabase.from('membros').select('id, nome');
  if (erroMembros) throw erroMembros;

  const { data: presencas, error: erroPresencas } = await supabase
    .from('presencas')
    .select('membro_id, ensaios(peso, categoria)');
  if (erroPresencas) throw erroPresencas;

  const pontosPorMembro = new Map();
  presencas.forEach((p) => {
    const atual = pontosPorMembro.get(p.membro_id) || 0;
    pontosPorMembro.set(p.membro_id, atual + (p.ensaios?.peso || 1));
  });

  return (membros || [])
    .map((m) => {
      const pontos = pontosPorMembro.get(m.id) || 0;
      const nivel = calcularNivel(pontos);
      return {
        membro_id: m.id,
        nome: m.nome,
        pontos,
        nivel: { numero: nivel.numero, nome: nivel.nome, icone: nivel.icone },
      };
    })
    .filter((m) => m.pontos > 0)
    .sort((a, b) => b.pontos - a.pontos)
    .slice(0, limite)
    .map((m, index) => ({ ...m, posicao: index + 1 }));
}

// Compara estado antes/depois de uma presenca para o feedback pos-scan.
function compararEstado(antes, depois) {
  const novasConquistas = depois.conquistas
    .filter((c) => c.desbloqueada)
    .filter((c) => !antes.conquistas.find((a) => a.codigo === c.codigo && a.desbloqueada))
    .map((c) => ({ codigo: c.codigo, titulo: c.titulo, icone: c.icone }));

  const subiuNivel = depois.nivel.numero > antes.nivel.numero;

  return {
    pontosGanhos: depois.pontos - antes.pontos,
    pontosTotais: depois.pontos,
    subiuNivel,
    novoNivel: subiuNivel ? { numero: depois.nivel.numero, nome: depois.nivel.nome, icone: depois.nivel.icone } : null,
    novasConquistas,
  };
}

module.exports = {
  NIVEIS,
  CONQUISTAS,
  calcularPontos,
  calcularNivel,
  calcularStreak,
  calcularFrequencia,
  montarContexto,
  avaliarConquistas,
  obterResumoPresenca,
  montarPerfilGamificacao,
  montarRanking,
  compararEstado,
};
