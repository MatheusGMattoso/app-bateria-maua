const supabase = require('../config/supabase');
const feedService = require('./feedService');
const gamificacaoService = require('./gamificacaoService');

const INSTRUMENTOS_VALIDOS = [
  'Surdo',
  'Surdo 2',
  'Caixa',
  'Repique',
  'Tamborim',
  'Chocalho',
  'Agogô',
  'Prato',
  'Outro',
];

const CAMPOS_PERFIL = 'id, nome, perfil_acesso, instrumento, bio, avatar_url';
const CAMPOS_BASICOS = 'id, nome, perfil_acesso';
const BIO_MAX_LENGTH = 200;

function criarErro(mensagem, status = 400) {
  const erro = new Error(mensagem);
  erro.status = status;
  return erro;
}

async function verificarPermissaoEdicao(membroId, solicitanteId) {
  if (!solicitanteId) {
    throw criarErro('Solicitante nao informado.', 400);
  }

  if (solicitanteId === membroId) return;

  const { data: solicitante, error } = await supabase
    .from('membros')
    .select('id, perfil_acesso')
    .eq('id', solicitanteId)
    .single();

  if (error || !solicitante) {
    throw criarErro('Solicitante nao encontrado.', 403);
  }

  if (solicitante.perfil_acesso !== 'Administrador') {
    throw criarErro('Sem permissao para editar este perfil.', 403);
  }
}

async function selectMembroPorId(membroId) {
  let { data, error } = await supabase
    .from('membros')
    .select(CAMPOS_PERFIL)
    .eq('id', membroId)
    .single();

  if (!error) return data;

  const colunaInexistente =
    error.code === '42703' ||
    /instrumento|avatar_url|bio|created_at/.test(error.message || '');

  if (colunaInexistente) {
    ({ data, error } = await supabase
      .from('membros')
      .select(CAMPOS_BASICOS)
      .eq('id', membroId)
      .single());

    if (!error && data) {
      return { ...data, instrumento: null, bio: null, avatar_url: null };
    }
  }

  return null;
}

async function obterPerfilPublico(membroId) {
  const data = await selectMembroPorId(membroId);

  if (!data) {
    throw criarErro('Membro nao encontrado.', 404);
  }

  return data;
}

async function atualizarDados(membroId, solicitanteId, { instrumento, bio, remover_avatar }) {
  await verificarPermissaoEdicao(membroId, solicitanteId);

  const payload = {};

  if (instrumento !== undefined) {
    if (instrumento !== null && instrumento !== '' && !INSTRUMENTOS_VALIDOS.includes(instrumento)) {
      throw criarErro('Instrumento invalido.');
    }
    payload.instrumento = instrumento || null;
  }

  if (bio !== undefined) {
    const bioLimpa = typeof bio === 'string' ? bio.trim() : '';
    if (bioLimpa.length > BIO_MAX_LENGTH) {
      throw criarErro(`Bio deve ter no maximo ${BIO_MAX_LENGTH} caracteres.`);
    }
    payload.bio = bioLimpa || null;
  }

  if (remover_avatar === true) {
    payload.avatar_url = null;
  }

  if (Object.keys(payload).length === 0) {
    throw criarErro('Nenhum campo para atualizar.');
  }

  const { error } = await supabase.from('membros').update(payload).eq('id', membroId);

  if (error) {
    if (error.code === '42703' || /instrumento|avatar_url|bio/.test(error.message || '')) {
      throw criarErro(
        'Colunas de perfil ainda nao existem no banco. Execute a migration add_perfil_ritmista no Supabase.',
        500
      );
    }
    throw error;
  }
  return obterPerfilPublico(membroId);
}

async function atualizarAvatar(membroId, solicitanteId, { buffer, mimeType, baseUrl }) {
  await verificarPermissaoEdicao(membroId, solicitanteId);

  const { imagem_url } = await feedService.uploadImagem({
    buffer,
    mimeType,
    nomeArquivo: `avatar_${membroId}`,
    baseUrl,
  });

  const { error } = await supabase
    .from('membros')
    .update({ avatar_url: imagem_url })
    .eq('id', membroId);

  if (error) {
    if (error.code === '42703' || /avatar_url/.test(error.message || '')) {
      throw criarErro(
        'Coluna avatar_url ainda nao existe no banco. Execute a migration add_perfil_ritmista no Supabase.',
        500
      );
    }
    throw error;
  }
  return obterPerfilPublico(membroId);
}

function extrairTimestampEnsaio(codigoQr) {
  if (!codigoQr) return null;
  const match = String(codigoQr).match(/bateria_maua_(\d+)/);
  return match ? Number(match[1]) : null;
}

async function listarHistoricoPresencas(membroId, limite = 20) {
  const { data, error } = await supabase
    .from('presencas')
    .select('id, ensaio_id, ensaios(peso, categoria, codigo_qr)')
    .eq('membro_id', membroId);

  if (error) throw error;

  return (data || [])
    .map((item) => {
      const timestamp = extrairTimestampEnsaio(item.ensaios?.codigo_qr);
      return {
        id: item.id,
        data: timestamp ? new Date(timestamp).toISOString() : null,
        categoria: item.ensaios?.categoria || 'ensaio',
        peso: item.ensaios?.peso || 1,
        pontos: item.ensaios?.peso || 1,
      };
    })
    .sort((a, b) => {
      const ta = a.data ? new Date(a.data).getTime() : 0;
      const tb = b.data ? new Date(b.data).getTime() : 0;
      return tb - ta;
    })
    .slice(0, limite);
}

async function montarPerfilCompleto(membroId) {
  const [membro, gamificacao] = await Promise.all([
    obterPerfilPublico(membroId),
    gamificacaoService.montarPerfilGamificacao(membroId),
  ]);

  let historico = [];
  try {
    historico = await listarHistoricoPresencas(membroId);
  } catch (error) {
    console.error('Erro ao carregar historico de presencas:', error.message);
  }

  return { membro, gamificacao, historico };
}

module.exports = {
  INSTRUMENTOS_VALIDOS,
  BIO_MAX_LENGTH,
  obterPerfilPublico,
  atualizarDados,
  atualizarAvatar,
  listarHistoricoPresencas,
  montarPerfilCompleto,
};
