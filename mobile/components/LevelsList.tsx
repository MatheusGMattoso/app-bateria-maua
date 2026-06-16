import React from 'react';
import { Text, View } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { NIVEIS_MANGA, faixaPontosNivel, rotuloPontosNivel } from '../utils/gamificacaoUtils';

type Props = {
  pontos: number;
  nivelAtual: number;
};

export default function LevelsList({ pontos, nivelAtual }: Props) {
  const { colors, isDark } = useTheme();

  const sombraCard = {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: isDark ? 0.2 : 0.05,
    shadowRadius: 4,
    elevation: 2,
  };

  return (
    <View className="mb-6">
      <Text className="text-lg font-bold mb-1" style={{ color: colors.textPrimary }}>
        Todos os níveis
      </Text>
      <Text className="text-xs mb-3" style={{ color: colors.textSecondary }}>
        Pontos de manga vêm das presenças em ensaios e eventos (peso do QR Code).
      </Text>

      <View
        className="rounded-2xl px-4 py-3"
        style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, ...sombraCard }}
      >
        {NIVEIS_MANGA.map((nivel, indice) => {
          const desbloqueado = pontos >= nivel.min;
          const ehAtual = nivel.numero === nivelAtual;
          const ehUltimo = indice === NIVEIS_MANGA.length - 1;

          return (
            <View
              key={nivel.numero}
              className="flex-row items-center py-3"
              style={
                !ehUltimo
                  ? { borderBottomWidth: 1, borderBottomColor: colors.border }
                  : undefined
              }
            >
              <View
                className="w-11 h-11 rounded-xl items-center justify-center mr-3 shrink-0"
                style={{
                  backgroundColor: desbloqueado ? colors.accentSoft : colors.backgroundAlt,
                  opacity: desbloqueado ? 1 : 0.55,
                }}
              >
                <Text style={{ fontSize: 22 }}>{nivel.icone}</Text>
              </View>

              <View className="flex-1 min-w-0 pr-2">
                <View className="flex-row items-center flex-wrap" style={{ gap: 6 }}>
                  <Text
                    className="font-bold text-sm"
                    style={{ color: desbloqueado ? colors.textPrimary : colors.textMuted }}
                  >
                    Nível {nivel.numero} · {nivel.nome}
                  </Text>
                  {ehAtual ? (
                    <View className="px-2 py-0.5 rounded-full" style={{ backgroundColor: colors.accent }}>
                      <Text className="text-[9px] font-bold" style={{ color: colors.onAccent }}>
                        ATUAL
                      </Text>
                    </View>
                  ) : null}
                  {desbloqueado && !ehAtual ? (
                    <Text className="text-[10px] font-bold" style={{ color: colors.successText }}>
                      ✓
                    </Text>
                  ) : null}
                </View>
                <Text className="text-xs mt-0.5" style={{ color: colors.textSecondary }}>
                  {rotuloPontosNivel(nivel, indice)}
                </Text>
                <Text className="text-[10px] mt-0.5" style={{ color: colors.textMuted }}>
                  Faixa: {faixaPontosNivel(indice)}
                </Text>
              </View>

              <View className="items-end shrink-0">
                {!desbloqueado ? (
                  <Text className="text-xs font-bold" style={{ color: colors.textMuted }}>
                    Faltam {nivel.min - pontos}
                  </Text>
                ) : (
                  <Text className="text-[10px] font-semibold" style={{ color: colors.accent }}>
                    {nivel.min} pts
                  </Text>
                )}
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}
