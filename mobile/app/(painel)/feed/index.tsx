import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BASE_URL } from '../../../config/api';
import { fetchJson } from '../../../utils/apiClient';
import { useTheme } from '../../../context/ThemeContext';
import { useResponsive } from '../../../utils/responsive';
import ScreenHeader from '../../../components/ScreenHeader';
import ThemeToggle from '../../../components/ThemeToggle';
import EmptyState from '../../../components/EmptyState';
import PostComposer from '../../../components/PostComposer';
import PinnedAvisosSection from '../../../components/PinnedAvisosSection';
import PostCard from '../../../components/PostCard';
import { EmojiReacao, PostFeed } from '../../../types/feed';

const LIMITE_PAGINA = 20;

export default function FeedScreen() {
  const { colors } = useTheme();
  const { screenPadding } = useResponsive();
  const [usuario, setUsuario] = useState<any>(null);
  const [fixados, setFixados] = useState<PostFeed[]>([]);
  const [posts, setPosts] = useState<PostFeed[]>([]);
  const [pagina, setPagina] = useState(1);
  const [total, setTotal] = useState(0);
  const [carregando, setCarregando] = useState(true);
  const [carregandoMais, setCarregandoMais] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [reagindo, setReagindo] = useState(false);
  const [erro, setErro] = useState('');

  const temMais = posts.length < total;

  const carregarFeed = useCallback(
    async (paginaAlvo = 1, append = false, leitorId?: string) => {
      try {
        setErro('');
        const id = leitorId || usuario?.id;
        const params = new URLSearchParams({
          page: String(paginaAlvo),
          limit: String(LIMITE_PAGINA),
        });
        if (id) params.set('leitor_id', id);

        const dados = await fetchJson(`${BASE_URL}/feed?${params.toString()}`);

        setFixados(dados.fixados || []);
        setTotal(dados.total || 0);
        setPagina(dados.page || paginaAlvo);

        if (append) {
          setPosts((atual) => {
            const ids = new Set(atual.map((p) => p.id));
            const novos = (dados.posts || []).filter((p: PostFeed) => !ids.has(p.id));
            return [...atual, ...novos];
          });
        } else {
          setPosts(dados.posts || []);
        }
      } catch (error: any) {
        setErro(error.message || 'Erro ao carregar o mural.');
      }
    },
    [usuario?.id],
  );

  useEffect(() => {
    (async () => {
      const usuarioStorage = await AsyncStorage.getItem('usuario');
      if (usuarioStorage) {
        const u = JSON.parse(usuarioStorage);
        setUsuario(u);
        setCarregando(true);
        await carregarFeed(1, false, u.id);
        setCarregando(false);
      } else {
        setCarregando(false);
      }
    })();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await carregarFeed(1, false);
    setRefreshing(false);
  };

  const carregarMais = async () => {
    if (carregandoMais || !temMais || carregando) return;
    setCarregandoMais(true);
    await carregarFeed(pagina + 1, true);
    setCarregandoMais(false);
  };

  const atualizarAposAcao = () => carregarFeed(1, false);

  const reagir = async (postId: string, emoji: EmojiReacao) => {
    if (!usuario?.id) return;
    try {
      setReagindo(true);
      await fetchJson(`${BASE_URL}/feed/${postId}/reacoes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ membro_id: usuario.id, emoji }),
      });
      await carregarFeed(pagina, false);
    } catch (error: any) {
      setErro(error.message);
    } finally {
      setReagindo(false);
    }
  };

  const excluirPost = async (postId: string) => {
    if (!usuario?.id) return;
    try {
      await fetchJson(`${BASE_URL}/feed/${postId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          solicitante_id: usuario.id,
          perfil_acesso: usuario.perfil_acesso,
        }),
      });
      await atualizarAposAcao();
    } catch (error: any) {
      setErro(error.message);
    }
  };

  const fixarPost = async (postId: string, fixado: boolean) => {
    try {
      await fetchJson(`${BASE_URL}/feed/${postId}/fixar`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fixado, perfil_acesso: usuario?.perfil_acesso }),
      });
      await atualizarAposAcao();
    } catch (error: any) {
      setErro(error.message);
    }
  };

  const renderHeader = () => (
    <View>
      <ScreenHeader
        title="Mural"
        subtitle="Avisos da diretoria e publicações da bateria"
        right={<ThemeToggle />}
      />

      {usuario?.id ? (
        <PostComposer
          autorId={usuario.id}
          perfilAcesso={usuario.perfil_acesso || 'Membro'}
          onPublicado={atualizarAposAcao}
        />
      ) : null}

      <PinnedAvisosSection
        avisos={fixados}
        usuarioId={usuario?.id}
        perfilAcesso={usuario?.perfil_acesso}
        onReagir={reagir}
        onExcluir={excluirPost}
        onFixar={fixarPost}
        reagindo={reagindo}
      />

      {posts.length > 0 ? (
        <Text className="text-xs font-bold uppercase mb-3 ml-1" style={{ color: colors.textSecondary, letterSpacing: 1 }}>
          Publicações
        </Text>
      ) : null}
    </View>
  );

  const renderFooter = () => {
    if (!carregandoMais) return <View style={{ height: 24 }} />;
    return (
      <View className="py-4 items-center">
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  };

  if (carregando) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center" style={{ backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.accent} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: colors.background }}>
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <FlatList
          data={posts}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <PostCard
              post={item}
              usuarioId={usuario?.id}
              perfilAcesso={usuario?.perfil_acesso}
              onReagir={reagir}
              onExcluir={excluirPost}
              onFixar={fixarPost}
              reagindo={reagindo}
            />
          )}
          ListHeaderComponent={renderHeader}
          ListEmptyComponent={
            erro ? (
              <EmptyState icon="⚠️" title="Erro ao carregar" message={erro} />
            ) : (
              <EmptyState
                icon="📢"
                title="Nenhuma publicação ainda"
                message="Seja o primeiro a compartilhar algo com a bateria!"
              />
            )
          }
          ListFooterComponent={renderFooter}
          contentContainerStyle={{ padding: screenPadding, paddingBottom: 48 }}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />}
          onEndReached={carregarMais}
          onEndReachedThreshold={0.3}
          keyboardShouldPersistTaps="handled"
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
