import React from 'react';
import { Text, View } from 'react-native';
import { useTheme } from '../context/ThemeContext';

type Conquista = {
  codigo: string;
  titulo: string;
  descricao: string;
  icone: string;
  desbloqueada: boolean;
};

type Props = {
  conquista: Conquista;
  largura: number;
};

export default function AchievementBadge({ conquista, largura }: Props) {
  const { colors } = useTheme();
  const { desbloqueada } = conquista;

  return (
    <View
      className="rounded-2xl p-3 items-center"
      style={{
        width: largura,
        backgroundColor: desbloqueada ? colors.accentSoft : colors.card,
        borderWidth: 1,
        borderColor: desbloqueada ? colors.gold : colors.border,
        opacity: desbloqueada ? 1 : 0.45,
      }}
    >
      <Text style={{ fontSize: 28, marginBottom: 6 }}>{desbloqueada ? conquista.icone : '🔒'}</Text>
      <Text
        className="text-xs font-bold text-center"
        style={{ color: colors.textPrimary }}
        numberOfLines={1}
      >
        {conquista.titulo}
      </Text>
      <Text className="text-[10px] text-center mt-0.5" style={{ color: colors.textSecondary }} numberOfLines={2}>
        {conquista.descricao}
      </Text>
    </View>
  );
}
