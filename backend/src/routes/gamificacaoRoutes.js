const express = require('express');
const router = express.Router();
const gamificacaoController = require('../controllers/gamificacaoController');

// A rota de ranking precisa vir antes de /:membro_id para nao ser capturada como parametro.
router.get('/ranking', gamificacaoController.obterRanking);
router.get('/:membro_id', gamificacaoController.obterPerfil);

module.exports = router;
