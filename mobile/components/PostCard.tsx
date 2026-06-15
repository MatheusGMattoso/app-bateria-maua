import React from 'react';
import { Alert, Text, TouchableOpacity, View } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useTheme } from '../context/ThemeContext';
import { abreviarPerfil } from '../utils/responsive';
import { formatarTempoRelativo } from '../utils/relativeTime';
import { EmojiReacao, PostFeed } from '../types/feed';
import ReactionBar from './ReactionBar';

type Props = {
  post: PostFeed;
  usuarioId?: string | null;
  perfilAcesso?: string;
  onReagir: (postId: string, emoji: EmojiReacao) => void;
  onExcluir?: (postId: string) => void;
  onFixar?: (postId: string, fixado: boolean) => void;
  reagindo?: boolean;
  compacto?: boolean;
  emDetalhe?: boolean;
};

export default function PostCard({
  post,
  usuarioId,
  perfilAcesso,
  onReagir,
  onExcluir,
  onFixar,
  reagindo,
  compacto,
  emDetalhe,
}: Props) {
  const { colors, isDark } = useTheme();
  const router = useRouter();

  const ehAviso = post.tipo === 'aviso';
  const ehAutor = usuarioId === post.autor.id;
  const ehAdmin = perfilAcesso === 'Administrador';
  const ehDiretoria = perfilAcesso === 'Administrador' || perfilAcesso === 'Gestor de Módulo';
  const podeExcluir = ehAutor || ehAdmin;
  const podeFixar = ehDiretoria && ehAviso && onFixar;

  const bordaEsquerda = post.fixado ? colors.gold : ehAviso ? colors.gold : colors.accent;

  const confirmarExclusao = () => {
    Alert.alert('Excluir publicação', 'Tem certeza que deseja remover esta publicação?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Excluir', style: 'destructive', onPress: () => onExcluir?.(post.id) },
    ]);
  };

  return (
    <View
      className={`rounded-2xl mb-3 ${compacto ? 'p-3' : 'p-4'}`}
      style={{
        backgroundColor: colors.card,
        borderWidth: 1,
        borderColor: colors.border,
        borderLeftWidth: 4,
        borderLeftColor: bordaEsquerda,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: isDark ? 0.2 : 0.05,
        shadowRadius: 4,
        elevation: 2,
      }}
    >
      <View className="flex-row items-start justify-between">
        <View className="flex-1 mr-2">
          <View className="flex-row items-center flex-wrap" style={{ gap: 6 }}>
            <Text className="font-bold text-sm" style={{ color: colors.textPrimary }} numberOfLines={1}>
              {post.autor.nome}
            </Text>
            <View className="px-2 py-0.5 rounded-full" style={{ backgroundColor: colors.accentSoft }}>
              <Text className="text-[10px] font-bold" style={{ color: colors.accent }}>
                {abreviarPerfil(post.autor.perfil_acesso)}
              </Text>
            </View>
            {ehAviso ? (
              <View className="px-2 py-0.5 rounded-full" style={{ backgroundColor: colors.gold + '33' }}>
                <Text className="text-[10px] font-bold" style={{ color: colors.gold }}>
                  Aviso
                </Text>
              </View>
            ) : null}
            {post.fixado ? (
              <Text className="text-[10px] font-bold" style={{ color: colors.gold }}>
                📌 Fixado
              </Text>
            ) : null}
          </View>
          <Text className="text-xs mt-0.5" style={{ color: colors.textMuted }}>
            {formatarTempoRelativo(post.criado_em)}
          </Text>
        </View>

        <View className="flex-row items-center" style={{ gap: 4 }}>
          {podeFixar ? (
            <TouchableOpacity
              onPress={() => onFixar(post.id, !post.fixado)}
              className="px-2 py-1 rounded-lg"
              style={{ backgroundColor: colors.backgroundAlt }}
            >
              <Text className="text-xs" style={{ color: colors.textSecondary }}>
                {post.fixado ? 'Desfixar' : 'Fixar'}
              </Text>
            </TouchableOpacity>
          ) : null}
          {podeExcluir && onExcluir ? (
            <TouchableOpacity onPress={confirmarExclusao} className="px-2 py-1">
              <Text className="text-xs font-bold" style={{ color: colors.dangerText }}>
                Excluir
              </Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      <Text className={`${compacto ? 'text-sm' : 'text-base'} mt-3`} style={{ color: colors.textPrimary }}>
        {post.conteudo}
      </Text>

      {post.imagem_url ? (
        <Image
          source={{ uri: post.imagem_url }}
          className="w-full rounded-xl mt-3"
          style={{ height: compacto ? 160 : 220 }}
          contentFit="cover"
          transition={200}
        />
      ) : null}

      <ReactionBar
        reacoes={post.reacoes}
        minhaReacao={post.minhaReacao}
        onReagir={(emoji) => onReagir(post.id, emoji)}
        disabled={reagindo || !usuarioId}
      />

      {!compacto && !emDetalhe && post.totalComentarios > 0 ? (
        <TouchableOpacity
          onPress={() => router.push({ pathname: '/(painel)/feed/[id]', params: { id: post.id } })}
          className="mt-2"
          activeOpacity={0.7}
        >
          <Text className="text-xs font-semibold" style={{ color: colors.accent }}>
            {post.totalComentarios} comentário{post.totalComentarios !== 1 ? 's' : ''} ›
          </Text>
        </TouchableOpacity>
      ) : null}

      {!compacto && !emDetalhe ? (
        <TouchableOpacity
          onPress={() => router.push({ pathname: '/(painel)/feed/[id]', params: { id: post.id } })}
          className="mt-2 py-1"
          activeOpacity={0.7}
        >
          <Text className="text-xs" style={{ color: colors.textMuted }}>
            Comentar ›
          </Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}
