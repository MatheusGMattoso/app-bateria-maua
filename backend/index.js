const express = require('express');
const cors = require('cors');
const path = require('path');

//Importar rotas
const membroRoutes = require('./src/routes/membroRoutes');
const ensaioRoutes = require('./src/routes/ensaioRoutes');
const eventoRoutes = require('./src/routes/eventoRoutes');
const presencaRoutes = require('./src/routes/presencaRoutes');
const gamificacaoRoutes = require('./src/routes/gamificacaoRoutes');
const feedRoutes = require('./src/routes/feedRoutes');

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Imagens do mural (fallback local quando Supabase Storage nao estiver configurado)
app.use('/uploads/feed', express.static(path.join(__dirname, 'uploads', 'feed')));

//Rota de Membros
app.use('/api/membros', membroRoutes);

//Rota Criação de Ensaio
app.use('/api/ensaios', ensaioRoutes);

//Rota de eventos do calendário
app.use('/api/eventos', eventoRoutes);

// Rota de Presenças
app.use('/api/presencas', presencaRoutes);

// Rota de Gamificação
app.use('/api/gamificacao', gamificacaoRoutes);

// Rota do Feed / Mural Social
app.use('/api/feed', feedRoutes);

const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.json({ message: 'API do núcleo de Administração da bateria mauá Clube da Manga' })
});

app.use((err, req, res, next) => {
  if (err?.type === 'entity.too.large') {
    return res.status(413).json({ erro: 'Imagem muito grande. Tente uma foto menor.' });
  }
  return next(err);
});

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});