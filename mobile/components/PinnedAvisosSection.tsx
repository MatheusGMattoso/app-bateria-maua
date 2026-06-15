import React from 'react';
import { Text, View } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { EmojiReacao, PostFeed } from '../types/feed';
import PostCard from './PostCard';

type Props = {
  avisos: PostFeed[];
  usuarioId?: string | null;
  perfilAcesso?: string;
  onReagir: (postId: string, emoji: EmojiReacao) => void;
  onExcluir?: (postId: string) => void;
  onFixar?: (postId: string, fixado: boolean) => void;
  reagindo?: boolean;
};

export default function PinnedAvisosSection({
  avisos,
  usuarioId,
  perfilAcesso,
  onReagir,
  onExcluir,
  onFixar,
  reagindo,
}: Props) {
  const { colors } = useTheme();

  if (!avisos.length) return null;

  return (
    <View className="mb-4">
      <Text className="text-xs font-bold uppercase mb-3 ml-1" style={{ color: colors.gold, letterSpacing: 1 }}>
        Avisos fixados
      </Text>
      {avisos.map((aviso) => (
        <PostCard
          key={aviso.id}
          post={aviso}
          usuarioId={usuarioId}
          perfilAcesso={perfilAcesso}
          onReagir={onReagir}
          onExcluir={onExcluir}
          onFixar={onFixar}
          reagindo={reagindo}
        />
      ))}
    </View>
  );
}
