import React from 'react';
import { Text, TouchableOpacity } from 'react-native';
import { useTheme } from '../context/ThemeContext';

export default function ThemeToggle() {
  const { colors, isDark, toggleTheme } = useTheme();

  return (
    <TouchableOpacity
      onPress={toggleTheme}
      activeOpacity={0.7}
      accessibilityLabel={isDark ? 'Ativar modo claro' : 'Ativar modo escuro'}
      className="w-10 h-10 rounded-full items-center justify-center"
      style={{ backgroundColor: colors.accentSoft, borderWidth: 1, borderColor: colors.border }}
    >
      <Text style={{ fontSize: 18 }}>{isDark ? '☀️' : '🌙'}</Text>
    </TouchableOpacity>
  );
}
