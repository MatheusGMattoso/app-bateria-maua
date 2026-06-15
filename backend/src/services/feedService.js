const supabase = require('../config/supabase');
const fs = require('fs');
const path = require('path');

const PERFIS_DIRETORIA = ['Administrador', 'Gestor de Módulo'];
const EMOJIS_VALIDOS = ['🥭', '🥁', '🔥'];
const BUCKET_IMAGENS = 'feed-imagens';
const UPLOAD_DIR = path.join(__dirname, '..', '..', 'uploads', 'feed');

function ehDiretoria(perfilAcesso) {
  return PERFIS_DIRETORIA.includes(perfilAcesso);
}

function criarErro(mensagem, status = 400) {
  const erro = new Error(mensagem);
  erro.status = status;
  return erro;
}

function contagemReacoesVazia() {
  return { '🥭': 0, '🥁': 0, '🔥': 0 };
}

function agregarReacoes(reacoes) {
  const contagem = contagemReacoesVazia();
  reacoes.forEach((r) => {
    if (contagem[r.emoji] !== undefined) {
      contagem[r.emoji] += 1;
    }
  });
  return contagem;
}

async function buscarReacoesPorPosts(postIds, leitorId) {
  if (!postIds.length) return { porPost: new Map(), minhas: new Map() };

  const { data, error } = await supabase
    .from('reacoes')
    .select('post_id, membro_id, emoji')
    .in('post_id', postIds);

  if (error) throw error;

  const porPost = new Map();
  const minhas = new Map();

  (data || []).forEach((r) => {
    if (!porPost.has(r.post_id)) porPost.set(r.post_id, []);
    porPost.get(r.post_id).push(r);
    if (leitorId && r.membro_id === leitorId) {
      minhas.set(r.post_id, r.emoji);
    }
  });

  return { porPost, minhas };
}

async function contarComentariosPorPosts(postIds) {
  if (!postIds.length) return new Map();

  const { data, error } = await supabase
    .from('comentarios')
    .select('post_id')
    .in('post_id', postIds);

  if (error) {
    if (error.message?.includes("Could not find the table 'public.comentarios'")) {
      return new Map();
    }
    throw error;
  }

  const contagem = new Map();
  (data || []).forEach((c) => {
    contagem.set(c.post_id, (contagem.get(c.post_id) || 0) + 1);
  });
  return contagem;
}

function formatarPost(row, reacoesLista, minhaReacao, totalComentarios = 0) {
  const membro = row.membros || {};
  return {
    id: row.id,
    conteudo: row.conteudo,
    tipo: row.tipo,
    fixado: row.fixado,
    imagem_url: row.imagem_url || null,
    criado_em: row.criado_em,
    autor: {
      id: row.autor_id,
      nome: membro.nome || 'Membro',
      perfil_acesso: membro.perfil_acesso || 'Membro',
    },
    reacoes: agregarReacoes(reacoesLista),
    minhaReacao: minhaReacao || null,
    totalComentarios,
  };
}

async function enriquecerPosts(rows, leitorId) {
  const postIds = rows.map((r) => r.id);
  const { porPost, minhas } = await buscarReacoesPorPosts(postIds, leitorId);
  const comentarios = await contarComentariosPorPosts(postIds);

  return rows.map((row) =>
    formatarPost(
      row,
      porPost.get(row.id) || [],
      minhas.get(row.id),
      comentarios.get(row.id) || 0,
    ),
  );
}

async function listarFeed({ page = 1, limit = 20, leitor_id: leitorId } = {}) {
  const pagina = Math.max(1, Number(page) || 1);
  const limite = Math.min(50, Math.max(1, Number(limit) || 20));
  const offset = (pagina - 1) * limite;

  const { data: fixadosRaw, error: erroFixados } = await supabase
    .from('posts')
    .select('id, autor_id, conteudo, tipo, fixado, imagem_url, criado_em, membros(nome, perfil_acesso)')
    .eq('ativo', true)
    .eq('fixado', true)
    .order('criado_em', { ascending: false });

  if (erroFixados) throw erroFixados;

  const { count, error: erroCount } = await supabase
    .from('posts')
    .select('id', { count: 'exact', head: true })
    .eq('ativo', true)
    .eq('fixado', false);

  if (erroCount) throw erroCount;

  const { data: postsRaw, error: erroPosts } = await supabase
    .from('posts')
    .select('id, autor_id, conteudo, tipo, fixado, imagem_url, criado_em, membros(nome, perfil_acesso)')
    .eq('ativo', true)
    .eq('fixado', false)
    .order('criado_em', { ascending: false })
    .range(offset, offset + limite - 1);

  if (erroPosts) throw erroPosts;

  const [fixados, posts] = await Promise.all([
    enriquecerPosts(fixadosRaw || [], leitorId),
    enriquecerPosts(postsRaw || [], leitorId),
  ]);

  return {
    fixados,
    posts,
    total: count || 0,
    page: pagina,
    limit: limite,
  };
}

async function criarPublicacao({ autor_id, conteudo, tipo, perfil_acesso, imagem_url }) {
  const texto = conteudo?.trim() || '';
  if (!autor_id || (!texto && !imagem_url)) {
    throw criarErro('Informe um texto ou anexe uma foto.');
  }

  const tipoNormalizado = tipo === 'aviso' ? 'aviso' : 'post';

  if (tipoNormalizado === 'aviso' && !ehDiretoria(perfil_acesso)) {
    throw criarErro('Apenas administradores e gestores podem criar avisos.', 403);
  }

  const payload = {
    autor_id,
    conteudo: texto || '📷',
    tipo: tipoNormalizado,
    fixado: false,
    imagem_url: imagem_url || null,
  };

  const { data, error } = await supabase
    .from('posts')
    .insert([payload])
    .select('id, autor_id, conteudo, tipo, fixado, imagem_url, criado_em, membros(nome, perfil_acesso)')
    .single();

  if (error) throw error;

  const [post] = await enriquecerPosts([data], autor_id);
  return post;
}

async function alternarFixado(postId, fixado, perfil_acesso) {
  if (!ehDiretoria(perfil_acesso)) {
    throw criarErro('Apenas administradores e gestores podem fixar avisos.', 403);
  }

  const { data: post, error: erroPost } = await supabase
    .from('posts')
    .select('id, tipo')
    .eq('id', postId)
    .eq('ativo', true)
    .single();

  if (erroPost || !post) throw criarErro('Publicacao nao encontrada.', 404);
  if (post.tipo !== 'aviso') throw criarErro('Apenas avisos podem ser fixados.');

  const { data, error } = await supabase
    .from('posts')
    .update({ fixado: Boolean(fixado) })
    .eq('id', postId)
    .select('id, autor_id, conteudo, tipo, fixado, imagem_url, criado_em, membros(nome, perfil_acesso)')
    .single();

  if (error) throw error;

  const [formatado] = await enriquecerPosts([data], null);
  return formatado;
}

async function registrarReacao({ post_id, membro_id, emoji }) {
  if (!post_id || !membro_id) throw criarErro('post_id e membro_id sao obrigatorios.');
  if (!EMOJIS_VALIDOS.includes(emoji)) throw criarErro('Emoji de reacao invalido.');

  const { data: existente } = await supabase
    .from('reacoes')
    .select('id, emoji')
    .eq('post_id', post_id)
    .eq('membro_id', membro_id)
    .maybeSingle();

  if (existente?.emoji === emoji) {
    await supabase.from('reacoes').delete().eq('id', existente.id);
    return { removida: true, emoji: null };
  }

  const { error } = await supabase
    .from('reacoes')
    .upsert(
      { post_id, membro_id, emoji },
      { onConflict: 'post_id,membro_id' },
    );

  if (error) throw error;
  return { removida: false, emoji };
}

async function removerReacao({ post_id, membro_id }) {
  if (!post_id || !membro_id) throw criarErro('post_id e membro_id sao obrigatorios.');

  const { error } = await supabase
    .from('reacoes')
    .delete()
    .eq('post_id', post_id)
    .eq('membro_id', membro_id);

  if (error) throw error;
  return { removida: true };
}

async function excluirPublicacao({ post_id, solicitante_id, perfil_acesso }) {
  const { data: post, error: erroPost } = await supabase
    .from('posts')
    .select('id, autor_id')
    .eq('id', post_id)
    .eq('ativo', true)
    .single();

  if (erroPost || !post) throw criarErro('Publicacao nao encontrada.', 404);

  const ehAutor = post.autor_id === solicitante_id;
  const ehAdmin = perfil_acesso === 'Administrador';

  if (!ehAutor && !ehAdmin) {
    throw criarErro('Sem permissao para excluir esta publicacao.', 403);
  }

  const { error } = await supabase.from('posts').update({ ativo: false }).eq('id', post_id);
  if (error) throw error;

  return { mensagem: 'Publicacao removida.' };
}

async function obterPost(postId, leitorId) {
  const { data, error } = await supabase
    .from('posts')
    .select('id, autor_id, conteudo, tipo, fixado, imagem_url, criado_em, membros(nome, perfil_acesso)')
    .eq('id', postId)
    .eq('ativo', true)
    .single();

  if (error || !data) throw criarErro('Publicacao nao encontrada.', 404);

  const [post] = await enriquecerPosts([data], leitorId);
  return post;
}

async function listarComentarios(postId) {
  const { data, error } = await supabase
    .from('comentarios')
    .select('id, conteudo, criado_em, autor_id, membros(nome, perfil_acesso)')
    .eq('post_id', postId)
    .order('criado_em', { ascending: true });

  if (error) throw error;

  return (data || []).map((c) => ({
    id: c.id,
    conteudo: c.conteudo,
    criado_em: c.criado_em,
    autor: {
      id: c.autor_id,
      nome: c.membros?.nome || 'Membro',
      perfil_acesso: c.membros?.perfil_acesso || 'Membro',
    },
  }));
}

async function criarComentario({ post_id, autor_id, conteudo }) {
  if (!post_id || !autor_id || !conteudo?.trim()) {
    throw criarErro('post_id, autor_id e conteudo sao obrigatorios.');
  }

  const { data: post, error: erroPost } = await supabase
    .from('posts')
    .select('id')
    .eq('id', post_id)
    .eq('ativo', true)
    .single();

  if (erroPost || !post) throw criarErro('Publicacao nao encontrada.', 404);

  const { data, error } = await supabase
    .from('comentarios')
    .insert([{ post_id, autor_id, conteudo: conteudo.trim() }])
    .select('id, conteudo, criado_em, autor_id, membros(nome, perfil_acesso)')
    .single();

  if (error) throw error;

  return {
    id: data.id,
    conteudo: data.conteudo,
    criado_em: data.criado_em,
    autor: {
      id: data.autor_id,
      nome: data.membros?.nome || 'Membro',
      perfil_acesso: data.membros?.perfil_acesso || 'Membro',
    },
  };
}

async function excluirComentario({ comentario_id, solicitante_id, perfil_acesso }) {
  const { data: comentario, error: erro } = await supabase
    .from('comentarios')
    .select('id, autor_id')
    .eq('id', comentario_id)
    .single();

  if (erro || !comentario) throw criarErro('Comentario nao encontrado.', 404);

  const ehAutor = comentario.autor_id === solicitante_id;
  const ehAdmin = perfil_acesso === 'Administrador';

  if (!ehAutor && !ehAdmin) {
    throw criarErro('Sem permissao para excluir este comentario.', 403);
  }

  const { error: erroDelete } = await supabase.from('comentarios').delete().eq('id', comentario_id);
  if (erroDelete) throw erroDelete;

  return { mensagem: 'Comentario removido.' };
}

function garantirPastaUpload() {
  if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  }
}

function salvarImagemLocal({ buffer, mimeType, nomeArquivo }) {
  garantirPastaUpload();
  const extensao = mimeType?.includes('png') ? 'png' : mimeType?.includes('webp') ? 'webp' : 'jpg';
  const caminho = `${Date.now()}_${nomeArquivo || 'imagem'}.${extensao}`;
  const caminhoCompleto = path.join(UPLOAD_DIR, caminho);
  fs.writeFileSync(caminhoCompleto, buffer);
  return caminho;
}

async function uploadImagem({ buffer, mimeType, nomeArquivo, baseUrl }) {
  const extensao = mimeType?.includes('png') ? 'png' : mimeType?.includes('webp') ? 'webp' : 'jpg';
  const caminho = `${Date.now()}_${nomeArquivo || 'imagem'}.${extensao}`;

  const { error } = await supabase.storage
    .from(BUCKET_IMAGENS)
    .upload(caminho, buffer, { contentType: mimeType || 'image/jpeg', upsert: false });

  if (!error) {
    const { data: urlData } = supabase.storage.from(BUCKET_IMAGENS).getPublicUrl(caminho);
    return { imagem_url: urlData.publicUrl };
  }

  console.warn('Supabase Storage indisponivel, usando armazenamento local:', error.message);
  const arquivoLocal = salvarImagemLocal({ buffer, mimeType, nomeArquivo });
  const host = baseUrl || 'http://localhost:3000';
  return { imagem_url: `${host}/uploads/feed/${arquivoLocal}` };
}

module.exports = {
  EMOJIS_VALIDOS,
  PERFIS_DIRETORIA,
  listarFeed,
  criarPublicacao,
  alternarFixado,
  registrarReacao,
  removerReacao,
  excluirPublicacao,
  obterPost,
  listarComentarios,
  criarComentario,
  excluirComentario,
  uploadImagem,
};
