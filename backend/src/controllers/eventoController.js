const supabase = require('../config/supabase');
const fs = require('fs');
const path = require('path');

const PERFIS_AUTORIZADOS = ['Administrador', 'Gestor de Módulo'];
const EVENTOS_FALLBACK_PATH = path.join(__dirname, '..', '..', 'data', 'eventos.json');

function ensureFallbackFile() {
  const pasta = path.dirname(EVENTOS_FALLBACK_PATH);
  if (!fs.existsSync(pasta)) {
    fs.mkdirSync(pasta, { recursive: true });
  }
  if (!fs.existsSync(EVENTOS_FALLBACK_PATH)) {
    fs.writeFileSync(EVENTOS_FALLBACK_PATH, '[]', 'utf8');
  }
}

function lerEventosFallback() {
  ensureFallbackFile();
  const conteudo = fs.readFileSync(EVENTOS_FALLBACK_PATH, 'utf8');
  return JSON.parse(conteudo);
}

function salvarEventosFallback(eventos) {
  ensureFallbackFile();
  fs.writeFileSync(EVENTOS_FALLBACK_PATH, JSON.stringify(eventos, null, 2), 'utf8');
}

function tabelaEventosInexistente(error) {
  const msg = error?.message || '';
  return msg.includes("Could not find the table 'public.eventos'");
}

exports.listarEventos = async (req, res) => {
  try {
    const { ano } = req.query;
    let query = supabase
      .from('eventos')
      .select('*')
      .order('data_evento', { ascending: true });

    if (ano) {
      const inicioAno = `${ano}-01-01`;
      const fimAno = `${ano}-12-31`;
      query = query.gte('data_evento', inicioAno).lte('data_evento', fimAno);
    }

    const { data, error } = await query;
    if (error) {
      if (tabelaEventosInexistente(error)) {
        const eventosLocais = lerEventosFallback();
        const eventosFiltrados = ano
          ? eventosLocais.filter((evento) => String(evento.data_evento || '').startsWith(`${ano}-`))
          : eventosLocais;
        return res.status(200).json({ eventos: eventosFiltrados });
      }
      throw error;
    }

    return res.status(200).json({ eventos: data || [] });
  } catch (error) {
    return res.status(500).json({ erro: error.message });
  }
};

exports.criarEvento = async (req, res) => {
  try {
    const { titulo, descricao, data_evento, criado_por, perfil_acesso } = req.body;

    if (!titulo || !data_evento) {
      return res.status(400).json({ erro: 'Titulo e data_evento sao obrigatorios.' });
    }

    if (!PERFIS_AUTORIZADOS.includes(perfil_acesso)) {
      return res.status(403).json({ erro: 'Apenas administradores podem agendar eventos.' });
    }

    const payload = {
      titulo,
      descricao: descricao || null,
      data_evento,
      criado_por: criado_por || null,
    };

    const { data, error } = await supabase
      .from('eventos')
      .insert([payload])
      .select()
      .single();

    if (error) {
      if (tabelaEventosInexistente(error)) {
        const eventosLocais = lerEventosFallback();
        const novoEvento = {
          id: `local_${Date.now()}`,
          ...payload,
        };
        eventosLocais.push(novoEvento);
        salvarEventosFallback(eventosLocais);

        return res.status(201).json({
          mensagem: 'Evento agendado com sucesso!',
          evento: novoEvento,
        });
      }
      throw error;
    }

    return res.status(201).json({
      mensagem: 'Evento agendado com sucesso!',
      evento: data,
    });
  } catch (error) {
    return res.status(500).json({ erro: error.message });
  }
};
