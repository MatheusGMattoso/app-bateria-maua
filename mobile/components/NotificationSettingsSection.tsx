import React, { useCallback, useState } from 'react';
import {
  Alert,
  Linking,
  Platform,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useTheme } from '../context/ThemeContext';
import { useNotifications } from '../context/NotificationContext';
import LoadingButton from './LoadingButton';
import {
  DEFAULT_PREFERENCES,
  loadPreferences,
  savePreferences,
  scheduleTestNotification,
  type NotificationPreferences,
} from '../services/notificationService';

export default function NotificationSettingsSection() {
  const { colors, isDark } = useTheme();
  const { permissionStatus, notificationsAvailable, requestPermission, resyncReminders } =
    useNotifications();
  const [prefs, setPrefs] = useState<NotificationPreferences>(DEFAULT_PREFERENCES);
  const [salvando, setSalvando] = useState(false);
  const [testando, setTestando] = useState(false);

  const carregarPrefs = useCallback(async () => {
    const dados = await loadPreferences();
    setPrefs(dados);
  }, []);

  useFocusEffect(
    useCallback(() => {
      carregarPrefs();
    }, [carregarPrefs])
  );

  const atualizarPref = (campo: keyof NotificationPreferences, valor: boolean) => {
    setPrefs((atual) => ({ ...atual, [campo]: valor }));
  };

  const salvar = async () => {
    try {
      setSalvando(true);
      await savePreferences(prefs);
      await resyncReminders(true);
      Alert.alert('Salvo', 'Suas preferências de lembretes foram atualizadas.');
    } catch {
      Alert.alert('Erro', 'Não foi possível salvar as preferências.');
    } finally {
      setSalvando(false);
    }
  };

  const solicitarPermissao = async () => {
    const ok = await requestPermission();
    if (!ok) {
      Alert.alert(
        'Permissão negada',
        'Ative as notificações nas configurações do dispositivo para receber lembretes.',
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Abrir configurações', onPress: () => Linking.openSettings() },
        ]
      );
    }
  };

  const testar = async () => {
    if (permissionStatus !== 'granted') {
      await solicitarPermissao();
      return;
    }

    try {
      setTestando(true);
      await scheduleTestNotification();
      Alert.alert('Teste agendado', 'Você receberá uma notificação em 5 segundos.');
    } catch {
      Alert.alert('Erro', 'Não foi possível agendar a notificação de teste.');
    } finally {
      setTestando(false);
    }
  };

  const sombraCard = {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: isDark ? 0.25 : 0.06,
    shadowRadius: 8,
    elevation: 3,
  };

  const renderSwitch = (
    label: string,
    descricao: string,
    campo: keyof NotificationPreferences
  ) => (
    <View
      className="flex-row items-center justify-between py-4"
      style={{ borderBottomWidth: 1, borderBottomColor: colors.border }}
    >
      <View className="flex-1 pr-4">
        <Text className="font-bold text-sm" style={{ color: colors.textPrimary }}>
          {label}
        </Text>
        <Text className="text-xs mt-1" style={{ color: colors.textSecondary }}>
          {descricao}
        </Text>
      </View>
      <Switch
        value={prefs[campo]}
        onValueChange={(v) => atualizarPref(campo, v)}
        trackColor={{ false: colors.border, true: colors.accentSoft }}
        thumbColor={prefs[campo] ? colors.accent : colors.textMuted}
      />
    </View>
  );

  return (
    <View>
      {notificationsAvailable && permissionStatus !== 'granted' && (
        <View
          className="rounded-2xl p-4 mb-4"
          style={{ backgroundColor: colors.accentSoft, borderWidth: 1, borderColor: colors.accent }}
        >
          <Text className="font-bold text-sm mb-1" style={{ color: colors.accent }}>
            Notificações desativadas
          </Text>
          <Text className="text-xs mb-3" style={{ color: colors.textSecondary }}>
            Permita notificações para receber lembretes mesmo com o app fechado
            {Platform.OS === 'ios' ? ' (requer build EAS para push remoto)' : ''}.
          </Text>
          <TouchableOpacity
            className="py-2 px-4 rounded-xl self-start"
            style={{ backgroundColor: colors.accent }}
            onPress={solicitarPermissao}
          >
            <Text className="font-bold text-xs" style={{ color: colors.onAccent }}>
              Ativar notificações
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {notificationsAvailable && (
        <>
      <View
        className="rounded-2xl px-4 mb-4"
        style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, ...sombraCard }}
      >
        {renderSwitch(
          'Lembrete 1h antes do ensaio',
          'Aviso uma hora antes de ensaios agendados no calendário.',
          'lembreteEnsaio'
        )}
        {renderSwitch(
          'Lembrete no dia do evento',
          'Notificação às 08:00 no dia de ensaios, shows e eventos.',
          'lembreteDia'
        )}
        {renderSwitch(
          'Alerta de frequência PAE',
          'Aviso quando sua frequência estiver abaixo de 70%.',
          'alertaPae'
        )}
      </View>

      <LoadingButton label="Salvar lembretes" loading={salvando} onPress={salvar} className="mb-3" />

      <TouchableOpacity
        className="h-12 rounded-xl items-center justify-center mb-2"
        style={{ backgroundColor: colors.backgroundAlt, borderWidth: 1, borderColor: colors.border }}
        onPress={testar}
        disabled={testando}
      >
        <Text className="font-bold text-sm" style={{ color: colors.textPrimary }}>
          {testando ? 'Agendando...' : 'Testar notificação (5s)'}
        </Text>
      </TouchableOpacity>

      <Text className="text-xs text-center px-2" style={{ color: colors.textMuted }}>
        Lembretes locais funcionam no Expo Go. Push remoto requer EAS Build.
      </Text>
        </>
      )}
    </View>
  );
}
