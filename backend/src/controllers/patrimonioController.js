const supabase = require('../config/supabase');
const patrimonioService = require('../services/patrimonioService');

const CATEGORIAS = ['Instrumento', 'Uniforme', 'Equipamento'];
const ESTADOS = ['Novo', 'Bom', 'Regular', 'Danificado'];
const STATUS = ['Disponível', 'Em uso', 'Manutenção', 'Emprestado', 'Baixado'];

const CAMPOS_EDITAVEIS = [
  'nome',
  'categoria',
  'codigo_patrimonio',
  'estado_conservacao',
  'status',
  'responsavel_id',
  'foto_url',
  'localizacao',
  'observacoes',
  'data_aquisicao',
];

const SELECT_COM_RESPONSAVEL = '*, responsavel:responsavel_id(nome)';

function comResponsavelNome(item) {
  if (!item) return item;
  const { responsavel, ...resto } = item;
  return { ...resto, responsavel_nome: responsavel?.nome || null };
}

exports.listar = async (req, res) => {
  try {
    const { categoria, status } = req.query;

    let query = supabase
      .from('patrimonio')
      .select(SELECT_COM_RESPONSAVEL)
      .order('nome', { ascending: true });

    if (categoria) query = query.eq('categoria', categoria);
    if (status) query = query.eq('status', status);

    const { data, error } = await query;
    if (error) throw error;

    return res.status(200).json({ itens: (data || []).map(comResponsavelNome) });
  } catch (error) {
    return res.status(500).json({ erro: error.message });
  }
};

exports.criar = async (req, res) => {
  try {
    const {
      nome,
      categoria,
      codigo_patrimonio,
      estado_conservacao,
      status,
      responsavel_id,
      foto_url,
      localizacao,
      observacoes,
      data_aquisicao,
    } = req.body;

    if (!nome || !nome.trim()) {
      return res.status(400).json({ erro: 'O nome do item e obrigatorio.' });
    }
    if (!CATEGORIAS.includes(categoria)) {
      return res.status(400).json({ erro: 'Categoria invalida.' });
    }
    if (estado_conservacao && !ESTADOS.includes(estado_conservacao)) {
      return res.status(400).json({ erro: 'Estado de conservacao invalido.' });
    }
    if (status && !STATUS.includes(status)) {
      return res.status(400).json({ erro: 'Status invalido.' });
    }

    const payload = {
      nome: nome.trim(),
      categoria,
      codigo_patrimonio: codigo_patrimonio || null,
      estado_conservacao: estado_conservacao || 'Bom',
      status: status || 'Disponível',
      responsavel_id: responsavel_id || null,
      foto_url: foto_url || null,
      localizacao: localizacao || null,
      observacoes: observacoes || null,
      data_aquisicao: data_aquisicao || null,
      criado_por: req.usuario?.id || null,
    };

    const { data, error } = await supabase
      .from('patrimonio')
      .insert([payload])
      .select(SELECT_COM_RESPONSAVEL)
      .single();

    if (error) throw error;

    return res.status(201).json({ mensagem: 'Item cadastrado com sucesso!', item: comResponsavelNome(data) });
  } catch (error) {
    return res.status(500).json({ erro: error.message });
  }
};

exports.atualizar = async (req, res) => {
  try {
    const { id } = req.params;

    const updates = {};
    for (const campo of CAMPOS_EDITAVEIS) {
      if (campo in req.body) updates[campo] = req.body[campo];
    }

    if ('nome' in updates && (!updates.nome || !updates.nome.trim())) {
      return res.status(400).json({ erro: 'O nome do item nao pode ficar vazio.' });
    }
    if ('categoria' in updates && !CATEGORIAS.includes(updates.categoria)) {
      return res.status(400).json({ erro: 'Categoria invalida.' });
    }
    if ('estado_conservacao' in updates && !ESTADOS.includes(updates.estado_conservacao)) {
      return res.status(400).json({ erro: 'Estado de conservacao invalido.' });
    }
    if ('status' in updates && !STATUS.includes(updates.status)) {
      return res.status(400).json({ erro: 'Status invalido.' });
    }
    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ erro: 'Nenhum campo para atualizar.' });
    }

    if ('nome' in updates) updates.nome = updates.nome.trim();
    updates.atualizado_em = new Date().toISOString();

    const { data, error } = await supabase
      .from('patrimonio')
      .update(updates)
      .eq('id', id)
      .select(SELECT_COM_RESPONSAVEL)
      .maybeSingle();

    if (error) throw error;
    if (!data) return res.status(404).json({ erro: 'Item nao encontrado.' });

    return res.status(200).json({ mensagem: 'Item atualizado com sucesso!', item: comResponsavelNome(data) });
  } catch (error) {
    return res.status(500).json({ erro: error.message });
  }
};

exports.excluir = async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('patrimonio')
      .delete()
      .eq('id', id)
      .select('id')
      .maybeSingle();

    if (error) throw error;
    if (!data) return res.status(404).json({ erro: 'Item nao encontrado.' });

    return res.status(200).json({ mensagem: 'Item removido com sucesso!' });
  } catch (error) {
    return res.status(500).json({ erro: error.message });
  }
};

exports.uploadFoto = async (req, res) => {
  try {
    const { imagem_base64, mime_type, nome_arquivo } = req.body;
    if (!imagem_base64) {
      return res.status(400).json({ erro: 'imagem_base64 e obrigatorio.' });
    }

    const base64Limpo = imagem_base64.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Limpo, 'base64');

    if (buffer.length > 5 * 1024 * 1024) {
      return res.status(400).json({ erro: 'Imagem muito grande. Maximo 5MB.' });
    }

    const protocolo = req.headers['x-forwarded-proto'] || req.protocol;
    const baseUrl = `${protocolo}://${req.get('host')}`;

    const resultado = await patrimonioService.uploadImagem({
      buffer,
      mimeType: mime_type,
      nomeArquivo: nome_arquivo || 'item',
      baseUrl,
    });

    return res.status(200).json(resultado);
  } catch (error) {
    return res.status(500).json({ erro: error.message });
  }
};
