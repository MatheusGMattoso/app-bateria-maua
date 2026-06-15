const supabase = require('../config/supabase');
const bcrypt = require('bcryptjs');

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
    const { perfil_acesso, solicitante_id } = req.body;
    const PERFIS_VALIDOS = ['Administrador', 'Gestor de Módulo', 'Membro'];

    if (!perfil_acesso || !PERFIS_VALIDOS.includes(perfil_acesso)) {
      return res.status(400).json({ message: 'Perfil invalido.' });
    }

    if (!solicitante_id) {
      return res.status(400).json({ message: 'Solicitante nao informado.' });
    }

    const { data: solicitante, error: erroSolicitante } = await supabase
      .from('membros')
      .select('id, perfil_acesso')
      .eq('id', solicitante_id)
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