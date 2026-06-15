const gamificacaoService = require('../services/gamificacaoService');

exports.obterRanking = async (req, res) => {
  try {
    const ranking = await gamificacaoService.montarRanking(10);
    res.status(200).json({ ranking });
  } catch (error) {
    console.error('Erro ao montar ranking:', error.message);
    res.status(500).json({ erro: 'Erro ao carregar o ranking.' });
  }
};

exports.obterPerfil = async (req, res) => {
  try {
    const { membro_id } = req.params;
    const perfil = await gamificacaoService.montarPerfilGamificacao(membro_id);
    res.status(200).json(perfil);
  } catch (error) {
    const status = error.status || 500;
    res.status(status).json({ erro: error.message || 'Erro ao carregar a gamificação.' });
  }
};
