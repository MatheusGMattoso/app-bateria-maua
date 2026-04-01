const express = require('express');
const router = express.Router();
const membroController = require('../controllers/membroController');

router.post('/registro', membroController.registrarMembro);

module.exports = router;