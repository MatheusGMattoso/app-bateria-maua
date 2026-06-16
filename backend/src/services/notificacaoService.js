const supabase = require('../config/supabase');
const gamificacaoService = require('./gamificacaoService');

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';
const PAE_MINIMO = 70;
const JANELA_CRON_MINUTOS = 15;

function montarDataHoraEvento(dataEvento, horarioEvento) {
  const horario = horarioEvento || '23:59';
  return new Date(`${dataEvento}T${horario}:00`);
}

function montarDataDiaEvento(dataEvento, hora = 8, minuto = 0) {
  const [ano, mes, dia] = dataEvento.split('-').map(Number);
  return new Date(ano, mes - 1, dia, hora, minuto, 0, 0);
}

function tipoLabel(tipo) {
  if (tipo === 'show') return 'Show';
  if (tipo === 'evento') return 'Evento';
  return 'Ensaio';
}

async function enviarPush(tokens, { title, body, data }) {
  const unicos = [...new Set(tokens.filter(Boolean))];
  if (unicos.length === 0) return { enviados: 0 };

  const mensagens = unicos.map((token) => ({
    to: token,
    sound: 'default',
    title,
    body,
    data: data || {},
  }));

  const resposta = await fetch(EXPO_PUSH_URL, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Accept-encoding': 'gzip, deflate',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(mensagens),
  });

  if (!resposta.ok) {
    const texto = await resposta.text();
    throw new Error(`Expo Push falhou: ${texto}`);
  }

  return { enviados: unicos.length };
}

async function buscarTokensAtivos() {
  const { data, error } = await supabase
    .from('push_tokens')
    .select('membro_id, expo_push_token');

  if (error) {
    if (error.message?.includes("Could not find the table")) return [];
    throw error;
  }

  return data || [];
}

async function buscarPreferenciasMap() {
  const { data, error } = await supabase.from('notificacao_preferencias').select('*');
  if (error) {
    if (error.message?.includes("Could not find the table")) return new Map();
    throw error;
  }

  const mapa = new Map();
  (data || []).forEach((pref) => mapa.set(pref.membro_id, pref));
  return mapa;
}

function prefsAtivas(pref, campo) {
  if (!pref) return true;
  return Boolean(pref[campo]);
}

async function registrarEnvio(membroId, eventoId, tipo) {
  try {
    await supabase.from('notificacao_envios').insert([{
      membro_id: membroId,
      evento_id: eventoId || null,
      tipo,
    }]);
  } catch {
    // deduplicacao via unique constraint
  }
}

async function jaEnviou(membroId, eventoId, tipo) {
  const { data, error } = await supabase
    .from('notificacao_envios')
    .select('id')
    .eq('membro_id', membroId)
    .eq('evento_id', eventoId)
    .eq('tipo', tipo)
    .maybeSingle();

  if (error) {
    if (error.message?.includes("Could not find the table")) return false;
    throw error;
  }

  return Boolean(data);
}

async function registrarToken(membroId, expoPushToken, platform) {
  const { data, error } = await supabase
    .from('push_tokens')
    .upsert(
      [{
        membro_id: membroId,
        expo_push_token: expoPushToken,
        platform: platform || null,
        atualizado_em: new Date().toISOString(),
      }],
      { onConflict: 'membro_id,expo_push_token' }
    )
    .select()
    .single();

  if (error) throw error;
  return data;
}

async function obterPreferencias(membroId) {
  const { data, error } = await supabase
    .from('notificacao_preferencias')
    .select('*')
    .eq('membro_id', membroId)
    .maybeSingle();

  if (error) {
    if (error.message?.includes("Could not find the table")) {
      return {
        membro_id: membroId,
        lembrete_ensaio: true,
        lembrete_dia: true,
        alerta_pae: true,
      };
    }
    throw error;
  }

  if (!data) {
    return {
      membro_id: membroId,
      lembrete_ensaio: true,
      lembrete_dia: true,
      alerta_pae: true,
    };
  }

  return data;
}

async function salvarPreferencias(membroId, prefs) {
  const payload = {
    membro_id: membroId,
    lembrete_ensaio: prefs.lembrete_ensaio ?? true,
    lembrete_dia: prefs.lembrete_dia ?? true,
    alerta_pae: prefs.alerta_pae ?? true,
  };

  const { data, error } = await supabase
    .from('notificacao_preferencias')
    .upsert([payload], { onConflict: 'membro_id' })
    .select()
    .single();

  if (error) throw error;
  return data;
}

async function notificarNovoEvento(evento) {
  const tokens = await buscarTokensAtivos();
  if (tokens.length === 0) return { enviados: 0 };

  const prefsMap = await buscarPreferenciasMap();
  const tipo = evento.tipo || 'ensaio';
  const label = tipoLabel(tipo);

  const destinos = tokens.filter((t) => prefsAtivas(prefsMap.get(t.membro_id), 'lembrete_dia'));
  if (destinos.length === 0) return { enviados: 0 };

  return enviarPush(
    destinos.map((d) => d.expo_push_token),
    {
      title: `Novo ${label.toLowerCase()} agendado`,
      body: `${evento.titulo} — ${evento.data_evento} às ${evento.horario_evento || ''}`.trim(),
      data: { eventoId: evento.id, screen: 'calendario', tipo: 'novo_evento' },
    }
  );
}

function dentroDaJanela(alvo, agora, minutos = JANELA_CRON_MINUTOS) {
  const diff = Math.abs(alvo.getTime() - agora.getTime());
  return diff <= minutos * 60 * 1000;
}

async function processarLembretesCron() {
  const agora = new Date();

  const { data: eventos, error: erroEventos } = await supabase
    .from('eventos')
    .select('*')
    .gte('data_evento', agora.toISOString().slice(0, 10));

  if (erroEventos) {
    if (erroEventos.message?.includes("Could not find the table")) {
      return { processados: 0, enviados: 0 };
    }
    throw erroEventos;
  }

  const tokens = await buscarTokensAtivos();
  const prefsMap = await buscarPreferenciasMap();
  let enviados = 0;

  for (const evento of eventos || []) {
    const dataHora = montarDataHoraEvento(evento.data_evento, evento.horario_evento);
    if (dataHora <= agora) continue;

    const tipo = evento.tipo || 'ensaio';
    const label = tipoLabel(tipo);
    const manha = montarDataDiaEvento(evento.data_evento, 8, 0);
    const umaHoraAntes = new Date(dataHora.getTime() - 60 * 60 * 1000);

    for (const tokenInfo of tokens) {
      const pref = prefsMap.get(tokenInfo.membro_id);

      if (tipo === 'ensaio' && prefsAtivas(pref, 'lembrete_ensaio') && dentroDaJanela(umaHoraAntes, agora)) {
        const chave = `ensaio_1h_${evento.id}`;
        const enviado = await jaEnviou(tokenInfo.membro_id, evento.id, chave);
        if (!enviado) {
          await enviarPush([tokenInfo.expo_push_token], {
            title: `${label} em 1 hora`,
            body: `${evento.titulo} — ${evento.horario_evento || ''}`.trim(),
            data: { eventoId: evento.id, screen: 'calendario', tipo: 'ensaio_1h' },
          });
          await registrarEnvio(tokenInfo.membro_id, evento.id, chave);
          enviados += 1;
        }
      }

      if (prefsAtivas(pref, 'lembrete_dia') && dentroDaJanela(manha, agora)) {
        const chave = `evento_dia_${evento.id}`;
        const enviado = await jaEnviou(tokenInfo.membro_id, evento.id, chave);
        if (!enviado) {
          await enviarPush([tokenInfo.expo_push_token], {
            title: `Hoje: ${evento.titulo}`,
            body: `${label} às ${evento.horario_evento || 'horário a confirmar'}`,
            data: { eventoId: evento.id, screen: 'calendario', tipo: 'evento_dia' },
          });
          await registrarEnvio(tokenInfo.membro_id, evento.id, chave);
          enviados += 1;
        }
      }
    }
  }

  // Alerta PAE semanal
  const membrosUnicos = [...new Set(tokens.map((t) => t.membro_id))];
  for (const membroId of membrosUnicos) {
    const pref = prefsMap.get(membroId);
    if (!prefsAtivas(pref, 'alerta_pae')) continue;

    const chave = `pae_baixo_${agora.toISOString().slice(0, 10).slice(0, 7)}`;
    const enviado = await jaEnviou(membroId, null, chave);
    if (enviado) continue;

    try {
      const perfil = await gamificacaoService.montarPerfilGamificacao(membroId);
      if (perfil.resumo.frequencia >= PAE_MINIMO) continue;

      const tokenMembro = tokens.filter((t) => t.membro_id === membroId).map((t) => t.expo_push_token);
      await enviarPush(tokenMembro, {
        title: 'Frequência PAE abaixo do mínimo',
        body: `Sua frequência está em ${perfil.resumo.frequencia}%. O mínimo exigido é ${PAE_MINIMO}%.`,
        data: { screen: 'presenca', tipo: 'pae_baixo' },
      });
      await registrarEnvio(membroId, null, chave);
      enviados += 1;
    } catch {
      // membro inexistente ou erro de calculo
    }
  }

  return { processados: (eventos || []).length, enviados };
}

module.exports = {
  registrarToken,
  obterPreferencias,
  salvarPreferencias,
  enviarPush,
  notificarNovoEvento,
  processarLembretesCron,
};
