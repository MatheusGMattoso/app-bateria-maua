const jwt = require('jsonwebtoken');

// Valida o token JWT enviado no header "Authorization: Bearer <token>".
// Em caso de sucesso, anexa os dados do usuario em req.usuario.
exports.autenticar = (req, res, next) => {
  const cabecalho = req.headers.authorization;

  if (!cabecalho || !cabecalho.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Token de autenticacao nao fornecido.' });
  }

  if (!process.env.JWT_SECRET) {
    console.error('JWT_SECRET nao definido nas variaveis de ambiente.');
    return res.status(500).json({ message: 'Erro de configuracao do servidor.' });
  }

  const token = cabecalho.split(' ')[1];

  try {
    req.usuario = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Token invalido ou expirado.' });
  }
};

// Restringe o acesso a determinados perfis. Use apos "autenticar".
// Ex.: router.patch('/:id', autenticar, autorizar('Administrador'), handler)
exports.autorizar = (...perfisPermitidos) => (req, res, next) => {
  if (!req.usuario || !perfisPermitidos.includes(req.usuario.perfil)) {
    return res.status(403).json({ message: 'Acesso negado. Permissao insuficiente.' });
  }
  next();
};
