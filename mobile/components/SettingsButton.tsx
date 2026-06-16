import React from 'react';
import { Text, TouchableOpacity } from 'react-native';
import { useRouter, type Href } from 'expo-router';
import { useTheme } from '../context/ThemeContext';
import { useResponsive } from '../utils/responsive';

export default function SettingsButton() {
  const router = useRouter();
  const { colors } = useTheme();
  const { isSmall } = useResponsive();
  const tamanho = isSmall ? 36 : 40;

  return (
    <TouchableOpacity
      onPress={() => router.push('/(painel)/configuracoes' as Href)}
      activeOpacity={0.7}
      accessibilityLabel="Abrir configurações"
      className="rounded-full items-center justify-center shrink-0"
      style={{
        width: tamanho,
        height: tamanho,
        backgroundColor: colors.accentSoft,
        borderWidth: 1,
        borderColor: colors.border,
      }}
    >
      <Text style={{ fontSize: isSmall ? 16 : 18 }}>⚙️</Text>
    </TouchableOpacity>
  );
}
