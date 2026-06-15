import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, RefreshControl, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BASE_URL } from '../../../config/api';
import { fetchJson } from '../../../utils/apiClient';
import { useTheme } from '../../../context/ThemeContext';
import { useResponsive } from '../../../utils/responsive';
import ScreenHeader from '../../../components/ScreenHeader';
import ThemeToggle from '../../../components/ThemeToggle';
import PostCard from '../../../components/PostCard';
import CommentList from '../../../components/CommentList';
import CommentComposer from '../../../components/CommentComposer';
import EmptyState from '../../../components/EmptyState';
import { ComentarioFeed, EmojiReacao, PostFeed } from '../../../types/feed';

export default function FeedDetalheScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const { screenPadding } = useResponsive();
  const [usuario, setUsuario] = useState<any>(null);
  const [post, setPost] = useState<PostFeed | null>(null);
  const [comentarios, setComentarios] = useState<ComentarioFeed[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [reagindo, setReagindo] = useState(false);
  const [erro, setErro] = useState('');

  const carregar = useCallback(async (leitorId?: string) => {
    if (!id) return;
    try {
      setErro('');
      const uid = leitorId || usuario?.id;
      const params = uid ? `?leitor_id=${uid}` : '';
      const [dadosPost, dadosComentarios] = await Promise.all([
        fetchJson(`${BASE_URL}/feed/${id}${params}`),
        fetchJson(`${BASE_URL}/feed/${id}/comentarios`),
      ]);
      setPost(dadosPost.post);
      setComentarios(dadosComentarios.comentarios || []);
    } catch (error: any) {
      setErro(error.message || 'Erro ao carregar a publicação.');
    }
  }, [id, usuario?.id]);

  useEffect(() => {
    (async () => {
      const usuarioStorage = await AsyncStorage.getItem('usuario');
      let u = null;
      if (usuarioStorage) {
        u = JSON.parse(usuarioStorage);
        setUsuario(u);
      }
      setCarregando(true);
      await carregar(u?.id);
      setCarregando(false);
    })();
  }, [id]);

  const onRefresh = async () => {
    setRefreshing(true);
    await carregar();
    setRefreshing(false);
  };

  const reagir = async (postId: string, emoji: EmojiReacao) => {
    if (!usuario?.id) return;
    try {
      setReagindo(true);
      await fetchJson(`${BASE_URL}/feed/${postId}/reacoes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ membro_id: usuario.id, emoji }),
      });
      await carregar();
    } catch (error: any) {
      Alert.alert('Erro', error.message);
    } finally {
      setReagindo(false);
    }
  };

  const excluirComentario = async (comentarioId: string) => {
    if (!usuario?.id) return;
    try {
      await fetchJson(`${BASE_URL}/feed/comentarios/${comentarioId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          solicitante_id: usuario.id,
          perfil_acesso: usuario.perfil_acesso,
        }),
      });
      await carregar();
    } catch (error: any) {
      Alert.alert('Erro', error.message);
    }
  };

  if (carregando) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center" style={{ backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.accent} />
      </SafeAreaView>
    );
  }

  if (erro || !post) {
    return (
      <SafeAreaView className="flex-1" style={{ backgroundColor: colors.background, padding: screenPadding }}>
        <ScreenHeader title="Publicação" right={<ThemeToggle />} />
        <EmptyState icon="⚠️" title="Não encontrada" message={erro || 'Esta publicação não existe.'} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: colors.background }}>
      <ScrollView
        contentContainerStyle={{ padding: screenPadding, paddingBottom: 48 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />}
        keyboardShouldPersistTaps="handled"
      >
        <ScreenHeader title="Publicação" subtitle="Comentários e reações" right={<ThemeToggle />} />

        <PostCard
          post={post}
          usuarioId={usuario?.id}
          perfilAcesso={usuario?.perfil_acesso}
          onReagir={reagir}
          reagindo={reagindo}
          emDetalhe
        />

        <View className="mt-4">
          <CommentList
            comentarios={comentarios}
            usuarioId={usuario?.id}
            perfilAcesso={usuario?.perfil_acesso}
            onExcluir={excluirComentario}
          />

          {usuario?.id ? (
            <CommentComposer postId={post.id} autorId={usuario.id} onComentado={carregar} />
          ) : null}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
