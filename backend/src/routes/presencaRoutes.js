const express = require('express');
const router = express.Router();
const presencaController = require('../controllers/presencaController');

// Rota para registrar a presença quando o ritmista lê o QR Code
router.post('/', presencaController.registrarPresenca);

//Rota para obter o resumo de presenças de um membro
router.get('/resumo/:membro_id', presencaController.obterResumo);

//Rota para download de CSV dos membros aprovados
router.get('/relatorio/aprovados', presencaController.gerarRelatorioAprovados)
module.exports = router;