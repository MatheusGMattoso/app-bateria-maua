import React from 'react';
import { Text, TouchableOpacity } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useResponsive } from '../utils/responsive';

export default function ThemeToggle() {
  const { colors, isDark, toggleTheme } = useTheme();
  const { isSmall } = useResponsive();
  const tamanho = isSmall ? 36 : 40;

  return (
    <TouchableOpacity
      onPress={toggleTheme}
      activeOpacity={0.7}
      accessibilityLabel={isDark ? 'Ativar modo claro' : 'Ativar modo escuro'}
      className="rounded-full items-center justify-center shrink-0"
      style={{
        width: tamanho,
        height: tamanho,
        backgroundColor: colors.accentSoft,
        borderWidth: 1,
        borderColor: colors.border,
      }}
    >
      <Text style={{ fontSize: isSmall ? 16 : 18 }}>{isDark ? '☀️' : '🌙'}</Text>
    </TouchableOpacity>
  );
}
