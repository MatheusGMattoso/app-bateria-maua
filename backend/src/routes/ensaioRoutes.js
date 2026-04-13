const express = require('express');
const router = express.Router();
const ensaioController = require('../controllers/ensaioController');

router.post('/', ensaioController.criarEnsaio);

module.exports = router;