import React, { useEffect, useRef } from 'react';
import { Animated, Modal, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useResponsive } from '../utils/responsive';

export type GamificacaoFeedback = {
  pontosGanhos: number;
  pontosTotais: number;
  subiuNivel: boolean;
  novoNivel: { numero: number; nome: string; icone: string } | null;
  novasConquistas: { codigo: string; titulo: string; icone: string }[];
};

type Props = {
  visible: boolean;
  feedback: GamificacaoFeedback | null;
  onClose: () => void;
};

export default function GamificationCelebration({ visible, feedback, onClose }: Props) {
  const { colors } = useTheme();
  const { screenPadding } = useResponsive();
  const escala = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      escala.setValue(0);
      Animated.spring(escala, {
        toValue: 1,
        useNativeDriver: true,
        tension: 60,
        friction: 7,
      }).start();
    }
  }, [visible, escala]);

  if (!feedback) return null;

  const { subiuNivel, novoNivel, novasConquistas } = feedback;

  const icone = subiuNivel && novoNivel ? novoNivel.icone : novasConquistas[0]?.icone || '🥭';
  const titulo = subiuNivel && novoNivel ? `Novo nível: ${novoNivel.nome}!` : 'Conquista desbloqueada!';

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View
        className="flex-1 items-center justify-center"
        style={{ backgroundColor: colors.overlay, paddingHorizontal: screenPadding }}
      >
        <Animated.View
          className="w-full rounded-3xl p-6 items-center"
          style={{
            backgroundColor: colors.card,
            borderWidth: 1,
            borderColor: colors.gold,
            transform: [{ scale: escala }],
          }}
        >
          <View
            className="w-20 h-20 rounded-full items-center justify-center mb-4"
            style={{ backgroundColor: colors.accentSoft }}
          >
            <Text style={{ fontSize: 40 }}>{icone}</Text>
          </View>

          <Text className="text-xl font-bold mb-1 text-center" style={{ color: colors.textPrimary }}>
            {titulo}
          </Text>

          {feedback.pontosGanhos > 0 ? (
            <Text className="text-sm font-semibold mb-3 text-center" style={{ color: colors.accent }}>
              +{feedback.pontosGanhos} pts de manga
            </Text>
          ) : null}

          {novasConquistas.length > 0 ? (
            <View className="w-full mb-3">
              {novasConquistas.map((c) => (
                <View
                  key={c.codigo}
                  className="flex-row items-center rounded-2xl px-3 py-2 mb-2"
                  style={{ backgroundColor: colors.accentSoft }}
                >
                  <Text style={{ fontSize: 20, marginRight: 8 }}>{c.icone}</Text>
                  <Text className="text-sm font-bold flex-1" style={{ color: colors.textPrimary }} numberOfLines={1}>
                    {c.titulo}
                  </Text>
                </View>
              ))}
            </View>
          ) : null}

          <TouchableOpacity
            onPress={onClose}
            activeOpacity={0.85}
            className="w-full h-[50px] rounded-2xl items-center justify-center mt-1"
            style={{ backgroundColor: colors.accent }}
          >
            <Text className="text-base font-bold" style={{ color: colors.onAccent }}>
              Continuar
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
}
