const express = require('express');
const cors = require('cors');

//Importar rotas
const membroRoutes = require('./src/routes/membroRoutes');
const ensaioRoutes = require('./src/routes/ensaioRoutes');
const eventoRoutes = require('./src/routes/eventoRoutes');
const presencaRoutes = require('./src/routes/presencaRoutes');

const app = express();
app.use(cors());
app.use(express.json());

//Rota de Membros
app.use('/api/membros', membroRoutes);

//Rota Criação de Ensaio
app.use('/api/ensaios', ensaioRoutes);

//Rota de eventos do calendário
app.use('/api/eventos', eventoRoutes);

// Rota de Presenças
app.use('/api/presencas', presencaRoutes);

const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.json({ message: 'API do núcleo de Administração da bateria mauá Clube da Manga' })
});

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});