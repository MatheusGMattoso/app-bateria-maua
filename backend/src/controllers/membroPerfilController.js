const membroPerfilService = require('../services/membroPerfilService');

exports.obterPerfil = async (req, res) => {
  try {
    const { id } = req.params;
    const membro = await membroPerfilService.obterPerfilPublico(id);
    res.status(200).json({ membro });
  } catch (error) {
    const status = error.status || 500;
    res.status(status).json({ erro: error.message || 'Erro ao carregar perfil.' });
  }
};

exports.obterPerfilCompleto = async (req, res) => {
  try {
    const { id } = req.params;
    const perfil = await membroPerfilService.montarPerfilCompleto(id);
    res.status(200).json(perfil);
  } catch (error) {
    const status = error.status || 500;
    res.status(status).json({ erro: error.message || 'Erro ao carregar perfil completo.' });
  }
};

exports.atualizarDados = async (req, res) => {
  try {
    const { id } = req.params;
    const { solicitante_id, instrumento, bio, remover_avatar } = req.body;
    const membro = await membroPerfilService.atualizarDados(id, solicitante_id, {
      instrumento,
      bio,
      remover_avatar,
    });
    res.status(200).json({ message: 'Perfil atualizado com sucesso.', membro });
  } catch (error) {
    const status = error.status || 500;
    res.status(status).json({ erro: error.message || 'Erro ao atualizar perfil.' });
  }
};

exports.atualizarAvatar = async (req, res) => {
  try {
    const { id } = req.params;
    const { solicitante_id, imagem_base64, mime_type } = req.body;

    if (!solicitante_id) {
      return res.status(400).json({ erro: 'solicitante_id e obrigatorio.' });
    }
    if (!imagem_base64) {
      return res.status(400).json({ erro: 'imagem_base64 e obrigatorio.' });
    }

    const base64Limpo = imagem_base64.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Limpo, 'base64');

    if (buffer.length > 5 * 1024 * 1024) {
      return res.status(400).json({ erro: 'Imagem muito grande. Maximo 5MB.' });
    }

    const protocolo = req.headers['x-forwarded-proto'] || req.protocol;
    const host = req.get('host');
    const baseUrl = `${protocolo}://${host}`;

    const membro = await membroPerfilService.atualizarAvatar(id, solicitante_id, {
      buffer,
      mimeType: mime_type,
      baseUrl,
    });

    res.status(200).json({ message: 'Avatar atualizado com sucesso.', membro });
  } catch (error) {
    const status = error.status || 500;
    res.status(status).json({ erro: error.message || 'Erro ao atualizar avatar.' });
  }
};

exports.listarPresencas = async (req, res) => {
  try {
    const { id } = req.params;
    const limite = Math.min(Number(req.query.limit) || 20, 50);
    const historico = await membroPerfilService.listarHistoricoPresencas(id, limite);
    res.status(200).json({ historico });
  } catch (error) {
    const status = error.status || 500;
    res.status(status).json({ erro: error.message || 'Erro ao carregar historico.' });
  }
};

exports.listarInstrumentos = (_req, res) => {
  res.status(200).json({ instrumentos: membroPerfilService.INSTRUMENTOS_VALIDOS });
};
