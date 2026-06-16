const express = require('express');
const router = express.Router();
const membroController = require('../controllers/membroController');
const { autenticar } = require('../middlewares/authMiddleware');

router.get('/', autenticar, membroController.listarMembros);
router.patch('/:id/perfil', autenticar, membroController.atualizarPerfil);
router.post('/registro', membroController.registrarMembro);
router.post('/login', membroController.login);

module.exports = router;