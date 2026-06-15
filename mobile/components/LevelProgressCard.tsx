import React from 'react';
import { Text, View } from 'react-native';
import { useTheme } from '../context/ThemeContext';

type Nivel = {
  numero: number;
  nome: string;
  icone?: string;
  progressoPct: number;
  proximoNivel: string | null;
  pontosParaProximo: number;
};

type Props = {
  nivel: Nivel;
  pontos: number;
  posicaoRanking?: number | null;
};

export default function LevelProgressCard({ nivel, pontos, posicaoRanking }: Props) {
  const { colors, isDark } = useTheme();

  return (
    <View
      className="rounded-2xl p-5 mb-5"
      style={{
        backgroundColor: colors.card,
        borderWidth: 1,
        borderColor: colors.border,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: isDark ? 0.25 : 0.06,
        shadowRadius: 8,
        elevation: 3,
      }}
    >
      <View className="flex-row items-center justify-between mb-4">
        <View className="flex-row items-center flex-1 min-w-0 pr-2">
          <View
            className="w-14 h-14 rounded-2xl items-center justify-center mr-3 shrink-0"
            style={{ backgroundColor: colors.accentSoft }}
          >
            <Text style={{ fontSize: 28 }}>{nivel.icone || '🥭'}</Text>
          </View>
          <View className="flex-1 min-w-0">
            <Text className="text-xs font-semibold" style={{ color: colors.textSecondary }}>
              Nível {nivel.numero}
            </Text>
            <Text className="text-lg font-bold" style={{ color: colors.textPrimary }} numberOfLines={1}>
              {nivel.nome}
            </Text>
          </View>
        </View>

        <View className="items-end shrink-0">
          <Text className="text-2xl font-black" style={{ color: colors.accent }}>
            {pontos}
          </Text>
          <Text className="text-[10px] font-semibold" style={{ color: colors.textSecondary }}>
            pts de manga
          </Text>
        </View>
      </View>

      <View className="h-3 rounded-full overflow-hidden" style={{ backgroundColor: colors.accentSoft }}>
        <View
          className="h-3 rounded-full"
          style={{ width: `${nivel.progressoPct}%`, backgroundColor: colors.accent }}
        />
      </View>

      <View className="flex-row items-center justify-between mt-2">
        <Text className="text-xs font-semibold" style={{ color: colors.textSecondary }}>
          {nivel.proximoNivel
            ? `Faltam ${nivel.pontosParaProximo} pts para ${nivel.proximoNivel}`
            : 'Nível máximo alcançado!'}
        </Text>
        {posicaoRanking ? (
          <View className="px-2 py-0.5 rounded-full" style={{ backgroundColor: colors.accentSoft }}>
            <Text className="text-[10px] font-bold" style={{ color: colors.accent }}>
              {posicaoRanking}º no ranking
            </Text>
          </View>
        ) : null}
      </View>
    </View>
  );
}
