const express = require('express');
const router = express.Router();
const membroController = require('../controllers/membroController');

router.get('/', membroController.listarMembros);
router.patch('/:id/perfil', membroController.atualizarPerfil);
router.post('/registro', membroController.registrarMembro);
router.post('/login', membroController.login);

module.exports = router;