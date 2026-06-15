import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { EMOJIS_REACAO, EmojiReacao, ReacoesContagem } from '../types/feed';

type Props = {
  reacoes: ReacoesContagem;
  minhaReacao: string | null;
  onReagir: (emoji: EmojiReacao) => void;
  disabled?: boolean;
};

export default function ReactionBar({ reacoes, minhaReacao, onReagir, disabled }: Props) {
  const { colors } = useTheme();

  return (
    <View className="flex-row items-center mt-3" style={{ gap: 8 }}>
      {EMOJIS_REACAO.map((emoji) => {
        const ativo = minhaReacao === emoji;
        const total = reacoes[emoji] || 0;

        return (
          <TouchableOpacity
            key={emoji}
            onPress={() => onReagir(emoji)}
            disabled={disabled}
            activeOpacity={0.7}
            className="flex-row items-center px-3 py-1.5 rounded-full"
            style={{
              backgroundColor: ativo ? colors.accentSoft : colors.backgroundAlt,
              borderWidth: 1,
              borderColor: ativo ? colors.accent : colors.border,
              opacity: disabled ? 0.5 : 1,
            }}
          >
            <Text style={{ fontSize: 16 }}>{emoji}</Text>
            {total > 0 ? (
              <Text
                className="text-xs font-bold ml-1"
                style={{ color: ativo ? colors.accent : colors.textSecondary }}
              >
                {total}
              </Text>
            ) : null}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}
