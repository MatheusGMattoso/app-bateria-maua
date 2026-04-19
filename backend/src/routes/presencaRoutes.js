const express = require('express');
const router = express.Router();
const presencaController = require('../controllers/presencaController');

// Rota para registrar a presença quando o ritmista lê o QR Code
router.post('/', presencaController.registrarPresenca);

module.exports = router;