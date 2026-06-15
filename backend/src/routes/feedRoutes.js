const express = require('express');
const router = express.Router();
const feedController = require('../controllers/feedController');

router.post('/upload', feedController.uploadImagem);
router.get('/', feedController.listar);
router.post('/', feedController.criar);
router.delete('/comentarios/:id', feedController.excluirComentario);
router.get('/:id/comentarios', feedController.listarComentarios);
router.post('/:id/comentarios', feedController.criarComentario);
router.patch('/:id/fixar', feedController.fixar);
router.post('/:id/reacoes', feedController.reagir);
router.delete('/:id/reacoes', feedController.removerReacao);
router.get('/:id', feedController.obterPost);
router.delete('/:id', feedController.excluir);

module.exports = router;
