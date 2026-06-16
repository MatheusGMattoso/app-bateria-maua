import React from 'react';
import { Text, View } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import EmptyState from './EmptyState';
import type { HistoricoPresenca } from '../utils/memberUtils';

const ROTULO_CATEGORIA: Record<string, string> = {
  ensaio: 'Ensaio',
  evento: 'Evento',
};

function formatarData(dataStr: string | null) {
  if (!dataStr) return 'Data não registrada';
  const data = new Date(dataStr);
  if (Number.isNaN(data.getTime())) return 'Data não registrada';
  return data.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

type Props = {
  historico: HistoricoPresenca[];
};

export default function PresenceHistoryList({ historico }: Props) {
  const { colors, isDark } = useTheme();

  if (historico.length === 0) {
    return (
      <EmptyState
        icon="📋"
        title="Nenhuma presença registrada"
        message="O histórico aparecerá aqui após registrar presenças via QR Code."
      />
    );
  }

  const sombraCard = {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: isDark ? 0.2 : 0.05,
    shadowRadius: 4,
    elevation: 2,
  };

  return (
    <View>
      {historico.map((item) => {
        const rotulo = ROTULO_CATEGORIA[item.categoria] || item.categoria;
        return (
          <View
            key={item.id}
            className="flex-row items-center justify-between p-4 rounded-2xl mb-2"
            style={{
              backgroundColor: colors.card,
              borderWidth: 1,
              borderColor: colors.border,
              ...sombraCard,
            }}
          >
            <View className="flex-1 pr-3">
              <Text className="font-bold text-sm" style={{ color: colors.textPrimary }}>
                {rotulo}
              </Text>
              <Text className="text-xs mt-0.5" style={{ color: colors.textSecondary }}>
                {formatarData(item.data)}
              </Text>
            </View>
            <View className="px-2 py-1 rounded-full" style={{ backgroundColor: colors.accentSoft }}>
              <Text className="text-xs font-bold" style={{ color: colors.accent }}>
                +{item.pontos} pt{item.pontos !== 1 ? 's' : ''}
              </Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}
