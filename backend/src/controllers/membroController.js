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

exports.login = async (req, res) => {
  const { email, senha } = req.body;

  if (!email || !senha) {
    return res.status(400).json({ message: "Por favor, preencha e-mail e senha." });
  }

  try {
    const { data: membro, error } = await supabase
      .from('membros')
      .select('*')
      .eq('email', email)
      .single();

    if (error || !membro) {
      return res.status(401).json({ message: "E-mail não encontrado." });
    }

    const senhaValida = await bcrypt.compare(senha, membro.senha_hash);

    if (!senhaValida) {
      return res.status(401).json({ message: "Senha incorreta." });
    }

    delete membro.senha_hash;
    
    return res.status(200).json({ 
      message: "Login realizado com sucesso!", 
      usuario: membro 
    });

  } catch (error) {
    console.error("Erro no login:", error);
    return res.status(500).json({ message: "Erro interno no servidor." });
  }
};