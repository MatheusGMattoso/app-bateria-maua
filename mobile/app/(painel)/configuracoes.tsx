import React from 'react';
import { ScrollView, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import ScreenHeader from '../../components/ScreenHeader';
import NotificationSettingsSection from '../../components/NotificationSettingsSection';
import { useResponsive } from '../../utils/responsive';

export default function ConfiguracoesScreen() {
  const { colors, isDark, toggleTheme } = useTheme();
  const { screenPadding, isSmall } = useResponsive();

  const sombraCard = {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: isDark ? 0.25 : 0.06,
    shadowRadius: 8,
    elevation: 3,
  };

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: colors.background }}>
      <ScrollView contentContainerStyle={{ padding: screenPadding, paddingBottom: 40 }}>
        <ScreenHeader
          title="Configurações"
          subtitle="Personalize a aparência e os lembretes do app."
        />

        <Text
          className="text-xs font-bold uppercase mb-3 ml-1"
          style={{ color: colors.textSecondary, letterSpacing: 1 }}
        >
          Aparência
        </Text>

        <View
          className="rounded-2xl px-4 py-4 mb-6"
          style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, ...sombraCard }}
        >
          <View className="flex-row items-center justify-between">
            <View className="flex-1 pr-4">
              <Text className="font-bold text-sm" style={{ color: colors.textPrimary }}>
                Modo noturno
              </Text>
              <Text className="text-xs mt-1" style={{ color: colors.textSecondary }}>
                {isDark
                  ? 'Tema escuro ativo. Desative para voltar ao modo tradicional (claro).'
                  : 'Modo tradicional ativo. Ative para usar o tema escuro.'}
              </Text>
            </View>
            <Switch
              value={isDark}
              onValueChange={toggleTheme}
              trackColor={{ false: colors.border, true: colors.accentSoft }}
              thumbColor={isDark ? colors.accent : colors.textMuted}
            />
          </View>

          <View
            className="flex-row items-center mt-4 pt-4"
            style={{ borderTopWidth: 1, borderTopColor: colors.border, gap: 12 }}
          >
            <View
              className={`${isSmall ? 'w-10 h-10' : 'w-12 h-12'} rounded-xl items-center justify-center`}
              style={{ backgroundColor: isDark ? colors.backgroundAlt : colors.accentSoft }}
            >
              <Text style={{ fontSize: isSmall ? 18 : 22 }}>{isDark ? '🌙' : '☀️'}</Text>
            </View>
            <View className="flex-1">
              <Text className="text-xs font-bold" style={{ color: colors.accent }}>
                {isDark ? 'Modo noturno' : 'Modo tradicional'}
              </Text>
              <Text className="text-xs mt-0.5" style={{ color: colors.textMuted }}>
                A preferência é salva automaticamente neste dispositivo.
              </Text>
            </View>
          </View>
        </View>

        <Text
          className="text-xs font-bold uppercase mb-3 ml-1"
          style={{ color: colors.textSecondary, letterSpacing: 1 }}
        >
          Lembretes
        </Text>

        <NotificationSettingsSection />
      </ScrollView>
    </SafeAreaView>
  );
}
