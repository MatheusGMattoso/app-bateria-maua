const express = require('express');
const router = express.Router();
const membroController = require('../controllers/membroController');

router.post('/registro', membroController.registrarMembro);
router.post('/login', membroController.login);

module.exports = router;