const express = require('express');
const router = express.Router();
const membroController = require('../controllers/membroController');
const membroPerfilController = require('../controllers/membroPerfilController');

router.get('/', membroController.listarMembros);
router.get('/instrumentos', membroPerfilController.listarInstrumentos);
router.get('/:id/perfil-completo', membroPerfilController.obterPerfilCompleto);
router.get('/:id/presencas', membroPerfilController.listarPresencas);
router.get('/:id', membroPerfilController.obterPerfil);
router.patch('/:id/dados', membroPerfilController.atualizarDados);
router.post('/:id/avatar', membroPerfilController.atualizarAvatar);
router.patch('/:id/perfil', membroController.atualizarPerfil);
router.post('/registro', membroController.registrarMembro);
router.post('/login', membroController.login);

module.exports = router;
