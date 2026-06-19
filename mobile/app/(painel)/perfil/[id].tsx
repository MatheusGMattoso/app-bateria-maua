import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { BASE_URL } from '../../../config/api';
import { fetchJson } from '../../../utils/apiClient';
import { useTheme } from '../../../context/ThemeContext';
import { useResponsive, abreviarPerfil } from '../../../utils/responsive';
import { ROTULO_PERFIL, type PerfilCompleto } from '../../../utils/memberUtils';
import ScreenHeader from '../../../components/ScreenHeader';
import EmptyState from '../../../components/EmptyState';
import MemberAvatar from '../../../components/MemberAvatar';
import LevelProgressCard from '../../../components/LevelProgressCard';
import AchievementBadge from '../../../components/AchievementBadge';
import PresenceHistoryList from '../../../components/PresenceHistoryList';
import ProfileEditSheet from '../../../components/ProfileEditSheet';
import HierarchyEditSheet from '../../../components/HierarchyEditSheet';

export default function PerfilRitmistaScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const { screenPadding, width } = useResponsive();

  const [usuario, setUsuario] = useState<any>(null);
  const [perfil, setPerfil] = useState<PerfilCompleto | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [erro, setErro] = useState('');
  const [editando, setEditando] = useState(false);
  const [editandoHierarquia, setEditandoHierarquia] = useState(false);

  const membroId = Array.isArray(id) ? id[0] : id;
  const ehProprioPerfil = usuario?.id === membroId;
  const ehAdministrador = usuario?.perfil_acesso === 'Administrador';

  const carregar = useCallback(async () => {
    if (!membroId) return;
    try {
      setErro('');
      const dados = await fetchJson<PerfilCompleto>(`${BASE_URL}/membros/${membroId}/perfil-completo`);
      setPerfil(dados);
    } catch (error: any) {
      setErro(error.message || 'Erro ao carregar perfil.');
    } finally {
      setCarregando(false);
    }
  }, [membroId]);

  useFocusEffect(
    useCallback(() => {
      (async () => {
        const usuarioStorage = await AsyncStorage.getItem('usuario');
        if (usuarioStorage) {
          setUsuario(JSON.parse(usuarioStorage));
        }
        setCarregando(true);
        await carregar();
      })();
    }, [carregar])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await carregar();
    setRefreshing(false);
  };

  const handleHierarquiaSalva = (novoNivel: string) => {
    setPerfil((atual) => (atual ? { ...atual, membro: { ...atual.membro, perfil_acesso: novoNivel } } : atual));
  };

  const handlePerfilSalvo = async (membroAtualizado: PerfilCompleto['membro']) => {
    setPerfil((atual) => (atual ? { ...atual, membro: membroAtualizado } : atual));

    if (ehProprioPerfil && usuario) {
      const usuarioAtualizado = {
        ...usuario,
        instrumento: membroAtualizado.instrumento,
        bio: membroAtualizado.bio,
        avatar_url: membroAtualizado.avatar_url,
      };
      setUsuario(usuarioAtualizado);
      await AsyncStorage.setItem('usuario', JSON.stringify(usuarioAtualizado));
    }
  };

  const larguraBadge = (width - screenPadding * 2 - 12) / 2;
  const perfilNome = perfil?.membro?.perfil_acesso || 'Membro';
  const conquistasDesbloqueadas =
    perfil?.gamificacao.conquistas.filter((c) => c.desbloqueada).slice(0, 4) || [];

  const sombraCard = {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: isDark ? 0.2 : 0.05,
    shadowRadius: 4,
    elevation: 2,
  };

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: colors.background }}>
      <ScrollView
        contentContainerStyle={{ padding: screenPadding, paddingBottom: 60 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.accent]} tintColor={colors.accent} />
        }
      >
        <ScreenHeader
          title="Perfil do ritmista"
          subtitle={ehProprioPerfil ? 'Seu perfil na bateria' : perfil?.membro.nome}
          onBack={() => router.back()}
        />

        {carregando ? (
          <View className="items-center py-12">
            <ActivityIndicator size="large" color={colors.accent} />
            <Text className="mt-3 text-sm" style={{ color: colors.textSecondary }}>
              Carregando perfil...
            </Text>
          </View>
        ) : erro ? (
          <EmptyState icon="⚠️" title="Não foi possível carregar" message={erro} />
        ) : perfil ? (
          <>
            <View
              className="rounded-2xl p-5 mb-5 items-center"
              style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, ...sombraCard }}
            >
              <MemberAvatar
                nome={perfil.membro.nome}
                avatarUrl={perfil.membro.avatar_url}
                tamanho="lg"
                destacado={ehProprioPerfil}
              />
              <Text className="text-xl font-bold mt-3" style={{ color: colors.textPrimary }}>
                {perfil.membro.nome}
              </Text>

              <View className="flex-row items-center flex-wrap justify-center mt-2" style={{ gap: 8 }}>
                <View className="px-2 py-1 rounded-full" style={{ backgroundColor: colors.accentSoft }}>
                  <Text className="text-[10px] font-bold" style={{ color: colors.accent }}>
                    {ROTULO_PERFIL[perfilNome] || abreviarPerfil(perfilNome)}
                  </Text>
                </View>
                {perfil.membro.instrumento ? (
                  <View className="px-2 py-1 rounded-full" style={{ backgroundColor: colors.backgroundAlt }}>
                    <Text className="text-[10px] font-bold" style={{ color: colors.textSecondary }}>
                      🥁 {perfil.membro.instrumento}
                    </Text>
                  </View>
                ) : null}
              </View>

              {perfil.membro.bio ? (
                <Text className="text-sm text-center mt-3 px-2" style={{ color: colors.textSecondary }}>
                  {perfil.membro.bio}
                </Text>
              ) : null}

              {ehProprioPerfil ? (
                <TouchableOpacity
                  className="mt-4 px-4 py-2 rounded-xl"
                  style={{ backgroundColor: colors.accent }}
                  onPress={() => setEditando(true)}
                >
                  <Text className="text-xs font-bold" style={{ color: colors.onAccent }}>
                    Editar perfil
                  </Text>
                </TouchableOpacity>
              ) : ehAdministrador ? (
                <TouchableOpacity
                  className="mt-4 px-4 py-2 rounded-xl"
                  style={{ backgroundColor: colors.accent }}
                  onPress={() => setEditandoHierarquia(true)}
                >
                  <Text className="text-xs font-bold" style={{ color: colors.onAccent }}>
                    Editar
                  </Text>
                </TouchableOpacity>
              ) : null}
            </View>

            <LevelProgressCard
              nivel={perfil.gamificacao.nivel}
              pontos={perfil.gamificacao.pontos}
            />

            {ehProprioPerfil ? (
              <TouchableOpacity
                className="mb-5 items-end"
                onPress={() => router.push('/(painel)/gamificacao')}
              >
                <Text className="text-xs font-bold" style={{ color: colors.accent }}>
                  Ver Minha Manga completa →
                </Text>
              </TouchableOpacity>
            ) : null}

            <View className="flex-row mb-6" style={{ gap: 10 }}>
              {[
                { valor: `${perfil.gamificacao.streak}`, rotulo: 'Sequência', icone: '🔥' },
                { valor: `${perfil.gamificacao.resumo.frequencia}%`, rotulo: 'Frequência', icone: '✅' },
                { valor: `${perfil.gamificacao.resumo.presencas}`, rotulo: 'Presenças', icone: '🥁' },
              ].map((item) => (
                <View
                  key={item.rotulo}
                  className="flex-1 p-3 rounded-2xl items-center min-w-0"
                  style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, ...sombraCard }}
                >
                  <Text style={{ fontSize: 18 }}>{item.icone}</Text>
                  <Text className="text-lg font-bold mt-1" style={{ color: colors.textPrimary }}>
                    {item.valor}
                  </Text>
                  <Text className="text-[10px] text-center" style={{ color: colors.textSecondary }} numberOfLines={1}>
                    {item.rotulo}
                  </Text>
                </View>
              ))}
            </View>

            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-lg font-bold" style={{ color: colors.textPrimary }}>
                Conquistas recentes
              </Text>
              <Text className="text-xs font-bold" style={{ color: colors.accent }}>
                {perfil.gamificacao.conquistasDesbloqueadas}/{perfil.gamificacao.conquistasTotal}
              </Text>
            </View>

            {conquistasDesbloqueadas.length === 0 ? (
              <View
                className="rounded-2xl mb-6 p-4"
                style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }}
              >
                <Text className="text-xs text-center" style={{ color: colors.textSecondary }}>
                  Nenhuma conquista desbloqueada ainda. Registre presenças para começar!
                </Text>
              </View>
            ) : (
              <View className="flex-row flex-wrap mb-6" style={{ gap: 12 }}>
                {conquistasDesbloqueadas.map((c) => (
                  <AchievementBadge key={c.codigo} conquista={c} largura={larguraBadge} />
                ))}
              </View>
            )}

            <Text className="text-lg font-bold mb-3" style={{ color: colors.textPrimary }}>
              Histórico de presenças
            </Text>
            <PresenceHistoryList historico={perfil.historico} />
          </>
        ) : null}
      </ScrollView>

      {perfil && ehProprioPerfil && usuario ? (
        <ProfileEditSheet
          visible={editando}
          membro={perfil.membro}
          solicitanteId={usuario.id}
          onClose={() => setEditando(false)}
          onSalvo={handlePerfilSalvo}
        />
      ) : null}

      {perfil && !ehProprioPerfil && ehAdministrador ? (
        <HierarchyEditSheet
          visible={editandoHierarquia}
          membro={perfil.membro}
          onClose={() => setEditandoHierarquia(false)}
          onSalvo={handleHierarquiaSalva}
        />
      ) : null}
    </SafeAreaView>
  );
}
