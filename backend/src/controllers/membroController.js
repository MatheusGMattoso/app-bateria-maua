const supabase = require('../config/supabase');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

exports.registrarMembro = async (req, res) => {
  try {
    const { nome, email, senha } = req.body;

    const salt = await bcrypt.genSalt(10);
    const senha_hash = await bcrypt.hash(senha, salt);

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

exports.listarMembros = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('membros')
      .select('id, nome, email, perfil_acesso')
      .order('nome', { ascending: true });

    if (error) throw error;

    res.status(200).json({ membros: data || [] });
  } catch (error) {
    console.error('Erro ao listar membros:', error);
    res.status(500).json({ message: 'Erro ao listar membros.' });
  }
};

exports.atualizarPerfil = async (req, res) => {
  try {
    const { id } = req.params;
    const { perfil_acesso } = req.body;
    // A identidade vem do token verificado (req.usuario), nunca do body.
    const solicitanteId = req.usuario.id;
    const PERFIS_VALIDOS = ['Administrador', 'Gestor de Módulo', 'Membro'];

    if (!perfil_acesso || !PERFIS_VALIDOS.includes(perfil_acesso)) {
      return res.status(400).json({ message: 'Perfil invalido.' });
    }

    const { data: solicitante, error: erroSolicitante } = await supabase
      .from('membros')
      .select('id, perfil_acesso')
      .eq('id', solicitanteId)
      .single();

    if (erroSolicitante || !solicitante) {
      return res.status(403).json({ message: 'Solicitante nao encontrado.' });
    }

    if (solicitante.perfil_acesso !== 'Administrador') {
      return res.status(403).json({ message: 'Apenas administradores podem alterar perfis.' });
    }

    const { data, error } = await supabase
      .from('membros')
      .update({ perfil_acesso })
      .eq('id', id)
      .select('id, nome, email, perfil_acesso')
      .single();

    if (error) throw error;

    if (!data) {
      return res.status(404).json({ message: 'Membro nao encontrado.' });
    }

    res.status(200).json({ message: 'Perfil atualizado com sucesso.', membro: data });
  } catch (error) {
    console.error('Erro ao atualizar perfil:', error);
    res.status(500).json({ message: 'Erro ao atualizar perfil.' });
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

    if (!process.env.JWT_SECRET) {
      console.error('JWT_SECRET nao definido nas variaveis de ambiente.');
      return res.status(500).json({ message: "Erro de configuracao do servidor." });
    }

    const payload = {
      id: membro.id,
      email: membro.email,
      perfil: membro.perfil_acesso,
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '3h' });

    delete membro.senha_hash;

    return res.status(200).json({
      message: "Login realizado com sucesso!",
      token,
      usuario: membro
    });

  } catch (error) {
    console.error("Erro no login:", error);
    return res.status(500).json({ message: "Erro interno no servidor." });
  }
};