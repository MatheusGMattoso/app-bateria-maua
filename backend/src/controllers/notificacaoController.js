const notificacaoService = require('../services/notificacaoService');

exports.registrarToken = async (req, res) => {
  try {
    const { membro_id, expo_push_token, platform } = req.body;

    if (!membro_id || !expo_push_token) {
      return res.status(400).json({ erro: 'membro_id e expo_push_token são obrigatórios.' });
    }

    const token = await notificacaoService.registrarToken(membro_id, expo_push_token, platform);
    return res.status(201).json({ mensagem: 'Token registrado.', token });
  } catch (error) {
    return res.status(500).json({ erro: error.message });
  }
};

exports.obterPreferencias = async (req, res) => {
  try {
    const { membro_id } = req.params;
    const prefs = await notificacaoService.obterPreferencias(membro_id);
    return res.status(200).json(prefs);
  } catch (error) {
    return res.status(500).json({ erro: error.message });
  }
};

exports.salvarPreferencias = async (req, res) => {
  try {
    const { membro_id } = req.params;
    const prefs = await notificacaoService.salvarPreferencias(membro_id, req.body);
    return res.status(200).json({ mensagem: 'Preferências salvas.', preferencias: prefs });
  } catch (error) {
    return res.status(500).json({ erro: error.message });
  }
};

exports.processarCron = async (req, res) => {
  try {
    const secret = process.env.NOTIFICACOES_CRON_SECRET;
    if (secret && req.headers['x-cron-secret'] !== secret) {
      return res.status(401).json({ erro: 'Não autorizado.' });
    }

    const resultado = await notificacaoService.processarLembretesCron();
    return res.status(200).json({ mensagem: 'Cron executado.', ...resultado });
  } catch (error) {
    return res.status(500).json({ erro: error.message });
  }
};
