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

function horarioValido(horario) {
  return /^([01]\d|2[0-3]):([0-5]\d)$/.test(horario);
}

function montarDataHoraEvento(dataEvento, horarioEvento) {
  const horarioNormalizado = horarioEvento || '23:59';
  return new Date(`${dataEvento}T${horarioNormalizado}:00`);
}

function filtrarEventosFuturos(eventos) {
  const agora = new Date();
  return eventos.filter((evento) => {
    const dataHoraEvento = montarDataHoraEvento(evento.data_evento, evento.horario_evento);
    return dataHoraEvento >= agora;
  });
}

async function limparEventosExpiradosNoBanco() {
  const hoje = new Date();
  const dataHoje = hoje.toISOString().slice(0, 10);
  const horaAgora = hoje.toTimeString().slice(0, 5);

  // Remove eventos com data anterior a hoje
  const { error: erroDatasAntigas } = await supabase
    .from('eventos')
    .delete()
    .lt('data_evento', dataHoje);
  if (erroDatasAntigas) throw erroDatasAntigas;

  // Remove eventos de hoje cujo horario ja passou
  const { error: erroHorariosPassados } = await supabase
    .from('eventos')
    .delete()
    .eq('data_evento', dataHoje)
    .lt('horario_evento', horaAgora);
  if (erroHorariosPassados) throw erroHorariosPassados;
}

exports.listarEventos = async (req, res) => {
  try {
    const { ano } = req.query;
    try {
      await limparEventosExpiradosNoBanco();
    } catch (errorLimpeza) {
      if (!tabelaEventosInexistente(errorLimpeza)) {
        throw errorLimpeza;
      }
    }

    let query = supabase
      .from('eventos')
      .select('*')
      .order('data_evento', { ascending: true })
      .order('horario_evento', { ascending: true });

    if (ano) {
      const inicioAno = `${ano}-01-01`;
      const fimAno = `${ano}-12-31`;
      query = query.gte('data_evento', inicioAno).lte('data_evento', fimAno);
    }

    const { data, error } = await query;
    if (error) {
      if (tabelaEventosInexistente(error)) {
        const eventosLocais = filtrarEventosFuturos(lerEventosFallback());
        salvarEventosFallback(eventosLocais);
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
    const { titulo, descricao, data_evento, horario_evento, criado_por, perfil_acesso } = req.body;

    if (!titulo || !data_evento) {
      return res.status(400).json({ erro: 'Titulo e data_evento sao obrigatorios.' });
    }

    if (!horario_evento || !horarioValido(horario_evento)) {
      return res.status(400).json({ erro: 'horario_evento deve estar no formato HH:MM.' });
    }

    const dataHoraEvento = montarDataHoraEvento(data_evento, horario_evento);
    if (Number.isNaN(dataHoraEvento.getTime())) {
      return res.status(400).json({ erro: 'Data/hora do evento invalida.' });
    }
    if (dataHoraEvento < new Date()) {
      return res.status(400).json({ erro: 'Nao e permitido agendar eventos no passado.' });
    }

    if (!PERFIS_AUTORIZADOS.includes(perfil_acesso)) {
      return res.status(403).json({ erro: 'Apenas administradores podem agendar eventos.' });
    }

    const payload = {
      titulo,
      descricao: descricao || null,
      data_evento,
      horario_evento,
      criado_por: criado_por || null,
    };

    const { data, error } = await supabase
      .from('eventos')
      .insert([payload])
      .select()
      .single();

    if (error) {
      if (tabelaEventosInexistente(error)) {
        const eventosLocais = filtrarEventosFuturos(lerEventosFallback());
        const novoEvento = {
          id: `local_${Date.now()}`,
          ...payload,
        };
        eventosLocais.push(novoEvento);
        const eventosOrdenados = eventosLocais.sort((a, b) => {
          const aData = `${a.data_evento}T${a.horario_evento || '23:59'}:00`;
          const bData = `${b.data_evento}T${b.horario_evento || '23:59'}:00`;
          return new Date(aData).getTime() - new Date(bData).getTime();
        });
        salvarEventosFallback(eventosOrdenados);

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
