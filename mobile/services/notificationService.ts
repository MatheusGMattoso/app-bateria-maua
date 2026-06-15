import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import type { NotificationContentInput } from 'expo-notifications/build/Notifications.types';
import { BASE_URL } from '../config/api';
import { fetchJson } from '../utils/apiClient';
import { notificationsSupported, pushNotificationsSupported } from '../utils/notificationsCapability';
import {
  ensureAndroidNotificationChannel,
  loadNotificationsLocal,
  type NotificationsLocalModule,
} from './notificationsModule';

export type TipoEvento = 'ensaio' | 'evento' | 'show';

export type EventoCalendario = {
  id?: string;
  titulo: string;
  descricao?: string | null;
  data_evento: string;
  horario_evento?: string | null;
  tipo?: TipoEvento | null;
};

export type NotificationPreferences = {
  lembreteEnsaio: boolean;
  lembreteDia: boolean;
  alertaPae: boolean;
};

export const DEFAULT_PREFERENCES: NotificationPreferences = {
  lembreteEnsaio: true,
  lembreteDia: true,
  alertaPae: true,
};

const PREFS_KEY = 'notificacao_preferencias';
const SCHEDULED_IDS_KEY = 'notificacao_scheduled_ids';
const PAE_ALERT_KEY = 'notificacao_pae_ultimo_alerta';
const RESYNC_THROTTLE_KEY = 'notificacao_ultimo_resync';
const RESYNC_INTERVAL_MS = 15 * 60 * 1000;
const PAE_MINIMO = 70;
const PAE_ALERT_INTERVAL_MS = 7 * 24 * 60 * 60 * 1000;

const TIPO_LABEL: Record<TipoEvento, string> = {
  ensaio: 'Ensaio',
  evento: 'Evento',
  show: 'Show',
};

async function loadNotifications(): Promise<NotificationsLocalModule | null> {
  if (!notificationsSupported()) return null;
  return loadNotificationsLocal();
}

function montarDataHoraEvento(evento: EventoCalendario): Date {
  const [ano, mes, dia] = evento.data_evento.split('-').map(Number);
  const [hora, minuto] = (evento.horario_evento || '08:00').split(':').map(Number);
  return new Date(ano, mes - 1, dia, hora, minuto, 0, 0);
}

function montarDataDiaEvento(evento: EventoCalendario, hora = 8, minuto = 0): Date {
  const [ano, mes, dia] = evento.data_evento.split('-').map(Number);
  return new Date(ano, mes - 1, dia, hora, minuto, 0, 0);
}

function normalizarTipo(tipo?: TipoEvento | null): TipoEvento {
  if (tipo === 'evento' || tipo === 'show' || tipo === 'ensaio') return tipo;
  return 'ensaio';
}

export { notificationsSupported, pushNotificationsSupported };

export async function requestPermissions(): Promise<boolean> {
  if (!Device.isDevice) return false;

  const Notifications = await loadNotifications();
  if (!Notifications) return false;

  const existente = await Notifications.getPermissionsAsync();
  if (existente.status === 'granted') return true;

  const solicitado = await Notifications.requestPermissionsAsync();
  return solicitado.status === 'granted';
}

export async function getPermissionStatus(): Promise<'granted' | 'denied' | 'undetermined'> {
  if (!notificationsSupported()) return 'undetermined';

  const Notifications = await loadNotifications();
  if (!Notifications) return 'undetermined';

  const { status } = await Notifications.getPermissionsAsync();
  return status;
}

export async function loadPreferences(): Promise<NotificationPreferences> {
  try {
    const remoto = await carregarPreferenciasRemotas();
    if (remoto) return remoto;
  } catch {
    // fallback local
  }

  const raw = await AsyncStorage.getItem(PREFS_KEY);
  if (!raw) return { ...DEFAULT_PREFERENCES };
  return { ...DEFAULT_PREFERENCES, ...JSON.parse(raw) };
}

export async function savePreferences(prefs: NotificationPreferences): Promise<void> {
  await AsyncStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
  try {
    await salvarPreferenciasRemotas(prefs);
  } catch {
    // mantem apenas local se backend indisponivel
  }
}

async function carregarPreferenciasRemotas(): Promise<NotificationPreferences | null> {
  const usuarioRaw = await AsyncStorage.getItem('usuario');
  if (!usuarioRaw) return null;

  const usuario = JSON.parse(usuarioRaw);
  if (!usuario?.id) return null;

  const dados = await fetchJson(`${BASE_URL}/notificacoes/preferencias/${usuario.id}`);
  return {
    lembreteEnsaio: dados.lembrete_ensaio ?? true,
    lembreteDia: dados.lembrete_dia ?? true,
    alertaPae: dados.alerta_pae ?? true,
  };
}

async function salvarPreferenciasRemotas(prefs: NotificationPreferences): Promise<void> {
  const usuarioRaw = await AsyncStorage.getItem('usuario');
  if (!usuarioRaw) return;

  const usuario = JSON.parse(usuarioRaw);
  if (!usuario?.id) return;

  await fetchJson(`${BASE_URL}/notificacoes/preferencias/${usuario.id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      lembrete_ensaio: prefs.lembreteEnsaio,
      lembrete_dia: prefs.lembreteDia,
      alerta_pae: prefs.alertaPae,
    }),
  });
}

async function loadScheduledIds(): Promise<string[]> {
  const raw = await AsyncStorage.getItem(SCHEDULED_IDS_KEY);
  if (!raw) return [];
  return JSON.parse(raw);
}

async function saveScheduledIds(ids: string[]): Promise<void> {
  await AsyncStorage.setItem(SCHEDULED_IDS_KEY, JSON.stringify(ids));
}

export async function cancelAllScheduled(): Promise<void> {
  const Notifications = await loadNotifications();
  if (!Notifications) return;

  const ids = await loadScheduledIds();
  await Promise.all(
    ids.map((id) => Notifications.cancelScheduledNotificationAsync(id).catch(() => undefined))
  );
  await Notifications.cancelAllScheduledNotificationsAsync();
  await saveScheduledIds([]);
}

async function scheduleAt(
  date: Date,
  content: NotificationContentInput
): Promise<string | null> {
  if (date.getTime() <= Date.now() + 5000) return null;

  const Notifications = await loadNotifications();
  if (!Notifications) return null;

  const id = await Notifications.scheduleNotificationAsync({
    content,
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date,
    },
  });

  return id;
}

export async function scheduleEventReminders(
  eventos: EventoCalendario[],
  prefs: NotificationPreferences
): Promise<void> {
  const agora = Date.now();
  const novosIds: string[] = [];

  for (const evento of eventos) {
    if (!evento.id) continue;

    const tipo = normalizarTipo(evento.tipo);
    const label = TIPO_LABEL[tipo];
    const dataHora = montarDataHoraEvento(evento);
    if (dataHora.getTime() <= agora) continue;

    if (prefs.lembreteEnsaio && tipo === 'ensaio') {
      const umaHoraAntes = new Date(dataHora.getTime() - 60 * 60 * 1000);
      const id = await scheduleAt(umaHoraAntes, {
        title: `${label} em 1 hora`,
        body: `${evento.titulo} — ${evento.horario_evento || ''}`.trim(),
        data: { eventoId: evento.id, tipo: 'ensaio_1h', screen: 'calendario' },
      });
      if (id) novosIds.push(id);
    }

    if (prefs.lembreteDia) {
      const manha = montarDataDiaEvento(evento, 8, 0);
      const id = await scheduleAt(manha, {
        title: `Hoje: ${evento.titulo}`,
        body: `${label} às ${evento.horario_evento || 'horário a confirmar'}`,
        data: { eventoId: evento.id, tipo: 'evento_dia', screen: 'calendario' },
      });
      if (id) novosIds.push(id);
    }
  }

  await saveScheduledIds(novosIds);
}

export async function checkPaeAlert(membroId: string, prefs: NotificationPreferences): Promise<void> {
  if (!prefs.alertaPae) return;

  const permissao = await getPermissionStatus();
  if (permissao !== 'granted') return;

  const ultimoAlerta = await AsyncStorage.getItem(PAE_ALERT_KEY);
  if (ultimoAlerta && Date.now() - Number(ultimoAlerta) < PAE_ALERT_INTERVAL_MS) return;

  const Notifications = await loadNotifications();
  if (!Notifications) return;

  try {
    const dados = await fetchJson(`${BASE_URL}/gamificacao/${membroId}`);
    const frequencia = dados?.resumo?.frequencia ?? 100;

    if (frequencia >= PAE_MINIMO) return;

    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Frequência PAE abaixo do mínimo',
        body: `Sua frequência está em ${frequencia}%. O mínimo exigido é ${PAE_MINIMO}%.`,
        data: { tipo: 'pae_baixo', screen: 'presenca' },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: 2,
      },
    });

    await AsyncStorage.setItem(PAE_ALERT_KEY, String(Date.now()));
  } catch {
    // silencioso se API indisponivel
  }
}

async function buscarEventosFuturos(): Promise<EventoCalendario[]> {
  const anoAtual = new Date().getFullYear();
  const dados = await fetchJson(`${BASE_URL}/eventos?ano=${anoAtual}`);
  const agora = Date.now();

  return (dados.eventos || []).filter((evento: EventoCalendario) => {
    const dataHora = montarDataHoraEvento(evento);
    return dataHora.getTime() > agora;
  });
}

export async function resyncAll(membroId: string, force = false): Promise<void> {
  if (!Device.isDevice || !notificationsSupported()) return;

  const permissao = await getPermissionStatus();
  if (permissao !== 'granted') return;

  if (!force) {
    const ultimo = await AsyncStorage.getItem(RESYNC_THROTTLE_KEY);
    if (ultimo && Date.now() - Number(ultimo) < RESYNC_INTERVAL_MS) {
      return;
    }
  }

  const prefs = await loadPreferences();
  await cancelAllScheduled();

  try {
    const eventos = await buscarEventosFuturos();
    await scheduleEventReminders(eventos, prefs);
  } catch {
    // ignora falha de rede
  }

  await checkPaeAlert(membroId, prefs);
  await AsyncStorage.setItem(RESYNC_THROTTLE_KEY, String(Date.now()));
}

export async function resyncEventReminders(membroId: string): Promise<void> {
  await resyncAll(membroId, true);
}

export async function scheduleTestNotification(): Promise<void> {
  const Notifications = await loadNotifications();
  if (!Notifications) {
    throw new Error('Notificações indisponíveis neste ambiente.');
  }

  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Lembrete de teste 🥁',
      body: 'As notificações da Bateria Mauá estão funcionando!',
      data: { tipo: 'teste', screen: 'calendario' },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: 5,
    },
  });
}

export async function registerForPushNotifications(membroId: string): Promise<string | null> {
  if (!Device.isDevice || !pushNotificationsSupported()) return null;

  const Notifications = await loadNotifications();
  if (!Notifications) return null;

  const permissao = await requestPermissions();
  if (!permissao) return null;

  if (Platform.OS === 'android') {
    await ensureAndroidNotificationChannel();
  }

  try {
    const { default: getExpoPushTokenAsync } = await import(
      'expo-notifications/build/getExpoPushTokenAsync'
    );
    const tokenData = await getExpoPushTokenAsync();
    const token = tokenData.data;

    await fetchJson(`${BASE_URL}/notificacoes/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        membro_id: membroId,
        expo_push_token: token,
        platform: Platform.OS,
      }),
    });

    return token;
  } catch {
    return null;
  }
}

export async function setupAfterLogin(membroId: string): Promise<void> {
  if (!notificationsSupported()) return;

  await requestPermissions();
  if (Platform.OS === 'android') {
    await ensureAndroidNotificationChannel();
  }
  if (pushNotificationsSupported()) {
    await registerForPushNotifications(membroId);
  }
  await resyncAll(membroId, true);
}

export async function addNotificationResponseListener(
  onResponse: (screen: string | undefined) => void
): Promise<(() => void) | null> {
  if (!notificationsSupported()) return null;

  const Notifications = await loadNotifications();
  if (!Notifications) return null;

  const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
    const screen = response.notification.request.content.data?.screen as string | undefined;
    onResponse(screen);
  });

  return () => subscription.remove();
}
