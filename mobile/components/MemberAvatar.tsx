import React from 'react';
import { Image, Text, View, ViewStyle } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { obterIniciais } from '../utils/memberUtils';

type Tamanho = 'sm' | 'md' | 'lg';

const TAMANHOS: Record<Tamanho, { box: number; font: number }> = {
  sm: { box: 48, font: 16 },
  md: { box: 72, font: 22 },
  lg: { box: 96, font: 28 },
};

type Props = {
  nome: string;
  avatarUrl?: string | null;
  tamanho?: Tamanho;
  style?: ViewStyle;
  destacado?: boolean;
};

export default function MemberAvatar({
  nome,
  avatarUrl,
  tamanho = 'md',
  style,
  destacado = false,
}: Props) {
  const { colors } = useTheme();
  const dim = TAMANHOS[tamanho];

  return (
    <View
      style={[
        {
          width: dim.box,
          height: dim.box,
          borderRadius: dim.box / 2,
          overflow: 'hidden',
          backgroundColor: colors.accent,
          borderWidth: destacado ? 2 : 0,
          borderColor: colors.accentLight,
          alignItems: 'center',
          justifyContent: 'center',
        },
        style,
      ]}
    >
      {avatarUrl ? (
        <Image source={{ uri: avatarUrl }} style={{ width: dim.box, height: dim.box }} />
      ) : (
        <Text className="font-bold" style={{ color: colors.onAccent, fontSize: dim.font }}>
          {obterIniciais(nome)}
        </Text>
      )}
    </View>
  );
}
