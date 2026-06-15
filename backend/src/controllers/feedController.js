const feedService = require('../services/feedService');

exports.listar = async (req, res) => {
  try {
    const { page, limit, leitor_id } = req.query;
    const resultado = await feedService.listarFeed({ page, limit, leitor_id });
    res.status(200).json(resultado);
  } catch (error) {
    console.error('Erro ao listar feed:', error.message);
    res.status(500).json({ erro: 'Erro ao carregar o mural.' });
  }
};

exports.obterPost = async (req, res) => {
  try {
    const { id } = req.params;
    const { leitor_id } = req.query;
    const post = await feedService.obterPost(id, leitor_id || null);
    res.status(200).json({ post });
  } catch (error) {
    const status = error.status || 500;
    res.status(status).json({ erro: error.message || 'Erro ao carregar a publicacao.' });
  }
};

exports.criar = async (req, res) => {
  try {
    const { autor_id, conteudo, tipo, perfil_acesso, imagem_url } = req.body;
    const post = await feedService.criarPublicacao({
      autor_id,
      conteudo,
      tipo,
      perfil_acesso,
      imagem_url,
    });
    res.status(201).json({ mensagem: 'Publicacao criada!', post });
  } catch (error) {
    const status = error.status || 500;
    res.status(status).json({ erro: error.message || 'Erro ao criar publicacao.' });
  }
};

exports.fixar = async (req, res) => {
  try {
    const { id } = req.params;
    const { fixado, perfil_acesso } = req.body;
    const post = await feedService.alternarFixado(id, fixado, perfil_acesso);
    res.status(200).json({ mensagem: fixado ? 'Aviso fixado.' : 'Aviso desfixado.', post });
  } catch (error) {
    const status = error.status || 500;
    res.status(status).json({ erro: error.message || 'Erro ao fixar aviso.' });
  }
};

exports.reagir = async (req, res) => {
  try {
    const { id } = req.params;
    const { membro_id, emoji } = req.body;
    const resultado = await feedService.registrarReacao({ post_id: id, membro_id, emoji });
    res.status(200).json(resultado);
  } catch (error) {
    const status = error.status || 500;
    res.status(status).json({ erro: error.message || 'Erro ao registrar reacao.' });
  }
};

exports.removerReacao = async (req, res) => {
  try {
    const { id } = req.params;
    const { membro_id } = req.body;
    await feedService.removerReacao({ post_id: id, membro_id });
    res.status(200).json({ removida: true });
  } catch (error) {
    const status = error.status || 500;
    res.status(status).json({ erro: error.message || 'Erro ao remover reacao.' });
  }
};

exports.excluir = async (req, res) => {
  try {
    const { id } = req.params;
    const { solicitante_id, perfil_acesso } = req.body;
    const resultado = await feedService.excluirPublicacao({
      post_id: id,
      solicitante_id,
      perfil_acesso,
    });
    res.status(200).json(resultado);
  } catch (error) {
    const status = error.status || 500;
    res.status(status).json({ erro: error.message || 'Erro ao excluir publicacao.' });
  }
};

exports.listarComentarios = async (req, res) => {
  try {
    const { id } = req.params;
    const comentarios = await feedService.listarComentarios(id);
    res.status(200).json({ comentarios });
  } catch (error) {
    console.error('Erro ao listar comentarios:', error.message);
    res.status(500).json({ erro: 'Erro ao carregar comentarios.' });
  }
};

exports.criarComentario = async (req, res) => {
  try {
    const { id } = req.params;
    const { autor_id, conteudo } = req.body;
    const comentario = await feedService.criarComentario({ post_id: id, autor_id, conteudo });
    res.status(201).json({ mensagem: 'Comentario adicionado!', comentario });
  } catch (error) {
    const status = error.status || 500;
    res.status(status).json({ erro: error.message || 'Erro ao criar comentario.' });
  }
};

exports.excluirComentario = async (req, res) => {
  try {
    const { id } = req.params;
    const { solicitante_id, perfil_acesso } = req.body;
    const resultado = await feedService.excluirComentario({
      comentario_id: id,
      solicitante_id,
      perfil_acesso,
    });
    res.status(200).json(resultado);
  } catch (error) {
    const status = error.status || 500;
    res.status(status).json({ erro: error.message || 'Erro ao excluir comentario.' });
  }
};

exports.uploadImagem = async (req, res) => {
  try {
    const { imagem_base64, mime_type, nome_arquivo } = req.body;
    if (!imagem_base64) {
      return res.status(400).json({ erro: 'imagem_base64 e obrigatorio.' });
    }

    const base64Limpo = imagem_base64.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Limpo, 'base64');

    if (buffer.length > 5 * 1024 * 1024) {
      return res.status(400).json({ erro: 'Imagem muito grande. Maximo 5MB.' });
    }

    const resultado = await feedService.uploadImagem({
      buffer,
      mimeType: mime_type,
      nomeArquivo: nome_arquivo,
    });

    res.status(200).json(resultado);
  } catch (error) {
    const status = error.status || 500;
    res.status(status).json({ erro: error.message || 'Erro no upload da imagem.' });
  }
};
