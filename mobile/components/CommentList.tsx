import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { abreviarPerfil } from '../utils/responsive';
import { formatarTempoRelativo } from '../utils/relativeTime';
import { ComentarioFeed } from '../types/feed';

type Props = {
  comentarios: ComentarioFeed[];
  usuarioId?: string | null;
  perfilAcesso?: string;
  onExcluir?: (comentarioId: string) => void;
};

export default function CommentList({ comentarios, usuarioId, perfilAcesso, onExcluir }: Props) {
  const { colors } = useTheme();

  if (!comentarios.length) {
    return (
      <Text className="text-sm text-center py-4" style={{ color: colors.textMuted }}>
        Nenhum comentário ainda. Seja o primeiro!
      </Text>
    );
  }

  return (
    <View>
      {comentarios.map((c) => {
        const podeExcluir =
          onExcluir && (usuarioId === c.autor.id || perfilAcesso === 'Administrador');

        return (
          <View
            key={c.id}
            className="p-3 rounded-xl mb-2"
            style={{ backgroundColor: colors.backgroundAlt, borderWidth: 1, borderColor: colors.border }}
          >
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center flex-1" style={{ gap: 6 }}>
                <Text className="text-xs font-bold" style={{ color: colors.textPrimary }} numberOfLines={1}>
                  {c.autor.nome}
                </Text>
                <View className="px-1.5 py-0.5 rounded-full" style={{ backgroundColor: colors.accentSoft }}>
                  <Text className="text-[9px] font-bold" style={{ color: colors.accent }}>
                    {abreviarPerfil(c.autor.perfil_acesso)}
                  </Text>
                </View>
              </View>
              {podeExcluir ? (
                <TouchableOpacity onPress={() => onExcluir(c.id)}>
                  <Text className="text-[10px] font-bold" style={{ color: colors.dangerText }}>
                    Excluir
                  </Text>
                </TouchableOpacity>
              ) : null}
            </View>
            <Text className="text-[10px] mt-0.5" style={{ color: colors.textMuted }}>
              {formatarTempoRelativo(c.criado_em)}
            </Text>
            <Text className="text-sm mt-1" style={{ color: colors.textPrimary }}>
              {c.conteudo}
            </Text>
          </View>
        );
      })}
    </View>
  );
}
