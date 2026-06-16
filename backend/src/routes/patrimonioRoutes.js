const express = require('express');
const router = express.Router();
const patrimonioController = require('../controllers/patrimonioController');
const { autenticar, autorizar } = require('../middlewares/authMiddleware');

const GESTORES = ['Administrador', 'Gestor de Módulo'];

router.get('/', autenticar, patrimonioController.listar);
router.post('/upload', autenticar, autorizar(...GESTORES), patrimonioController.uploadFoto);
router.post('/', autenticar, autorizar(...GESTORES), patrimonioController.criar);
router.patch('/:id', autenticar, autorizar(...GESTORES), patrimonioController.atualizar);
router.delete('/:id', autenticar, autorizar('Administrador'), patrimonioController.excluir);

module.exports = router;
