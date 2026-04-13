const express = require('express');
const cors = require('cors');

//Importar rotas
const membroRoutes = require('./src/routes/membroRoutes');
const ensaioRoutes = require('./src/routes/ensaioRoutes');

const app = express();
app.use(cors());
app.use(express.json());

//Rota de Membros
app.use('/api/membros', membroRoutes);

//Rota Criação de Ensaio
app.use('/api/ensaios', ensaioRoutes);

const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.json({ message: 'API do núcleo de Administração da bateria mauá Clube da Manga' })
});

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});