import React from 'react';
import { Text, View } from 'react-native';
import { useTheme } from '../context/ThemeContext';

type ItemRanking = {
  membro_id: string;
  nome: string;
  pontos: number;
  posicao: number;
  nivel: { numero: number; nome: string; icone: string };
};

type Props = {
  ranking: ItemRanking[];
  usuarioId?: string | null;
};

const MEDALHAS: Record<number, string> = { 1: '🥇', 2: '🥈', 3: '🥉' };

export default function RankingList({ ranking, usuarioId }: Props) {
  const { colors } = useTheme();

  return (
    <View>
      {ranking.map((item) => {
        const ehUsuario = item.membro_id === usuarioId;
        return (
          <View
            key={item.membro_id}
            className="flex-row items-center rounded-2xl p-3 mb-2"
            style={{
              backgroundColor: ehUsuario ? colors.accentSoft : colors.card,
              borderWidth: 1,
              borderColor: ehUsuario ? colors.accent : colors.border,
            }}
          >
            <View className="w-8 items-center mr-2 shrink-0">
              <Text style={{ fontSize: MEDALHAS[item.posicao] ? 20 : 14, fontWeight: '800', color: colors.textSecondary }}>
                {MEDALHAS[item.posicao] || `${item.posicao}º`}
              </Text>
            </View>

            <Text style={{ fontSize: 20, marginRight: 8 }}>{item.nivel.icone}</Text>

            <View className="flex-1 min-w-0">
              <Text className="text-sm font-bold" style={{ color: colors.textPrimary }} numberOfLines={1}>
                {item.nome}
              </Text>
              <Text className="text-[10px] font-semibold" style={{ color: colors.textSecondary }} numberOfLines={1}>
                {item.nivel.nome}
              </Text>
            </View>

            <View className="items-end shrink-0 ml-2">
              <Text className="text-base font-black" style={{ color: colors.accent }}>
                {item.pontos}
              </Text>
              <Text className="text-[9px] font-semibold" style={{ color: colors.textSecondary }}>
                pts
              </Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}
