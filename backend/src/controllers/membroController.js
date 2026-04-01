const supabase = require('../config/supabase');
const bcrypt = require('bcryptjs');

exports.registrarMembro = async (req, res) => {
  try {
    const { nome, email, senha } = req.body;

    //Criptografar a senha
    const salt = await bcrypt.genSalt(10);
    const senha_hash = await bcrypt.hash(senha, salt);

    //Inserir no banco de dados (padrão visitante)
    const { data, error } = await supabase
      .from('membros')
      .insert([{ nome, email, senha_hash }])
      .select();
    
    if (error) throw error;

    res.status(201).json({ message: 'Membro cadastrado com sucesso!', membro: data[0] });
  } catch (error) {
    console.error('Erro no cadastro:', error);
    res.status(500).json({ message: 'Erro ao cadastrar membro.' });
  }
};