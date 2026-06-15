const express = require('express');
const router = express.Router();
const eventoController = require('../controllers/eventoController');

router.get('/', eventoController.listarEventos);
router.post('/', eventoController.criarEvento);

module.exports = router;
