const express = require('express');
const router = express.Router();
const notificacaoController = require('../controllers/notificacaoController');

router.post('/token', notificacaoController.registrarToken);
router.get('/preferencias/:membro_id', notificacaoController.obterPreferencias);
router.patch('/preferencias/:membro_id', notificacaoController.salvarPreferencias);
router.get('/cron/lembretes', notificacaoController.processarCron);

module.exports = router;
