const express = require('express');
const router = express.Router();
const membroController = require('../controllers/membroController');
const membroPerfilController = require('../controllers/membroPerfilController');
const { autenticar } = require('../middlewares/authMiddleware');

router.get('/', autenticar, membroController.listarMembros);
router.get('/instrumentos', autenticar, membroPerfilController.listarInstrumentos);
router.get('/:id/perfil-completo', autenticar, membroPerfilController.obterPerfilCompleto);
router.get('/:id/presencas', autenticar, membroPerfilController.listarPresencas);
router.get('/:id', autenticar, membroPerfilController.obterPerfil);
router.patch('/:id/dados', autenticar, membroPerfilController.atualizarDados);
router.post('/:id/avatar', autenticar, membroPerfilController.atualizarAvatar);
router.patch('/:id/perfil', autenticar, membroController.atualizarPerfil);
router.post('/registro', membroController.registrarMembro);
router.post('/login', membroController.login);

module.exports = router;
